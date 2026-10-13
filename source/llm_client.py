import json
import os
from pathlib import Path
from tenacity import retry, stop_after_attempt, wait_exponential
import google.genai as genai
from PIL import Image

from config import API_KEY, MODEL_NAME

CACHE_DIR = Path("response_cache")
CACHE_DIR.mkdir(exist_ok=True)

def get_cache_path(bill_id: str, call_type: str) -> Path:
    return CACHE_DIR / f"{bill_id}_{call_type}.json"

def load_from_cache(bill_id: str, call_type: str) -> dict:
    path = get_cache_path(bill_id, call_type)
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return None

def save_to_cache(bill_id: str, call_type: str, response: dict):
    path = get_cache_path(bill_id, call_type)
    with open(path, 'w') as f:
        json.dump(response, f)

def preprocess_image(image_path: str) -> Image.Image:
    """Load image, handle EXIF rotation, resize if needed, return PIL Image."""
    img = Image.open(image_path)

    try:
        from PIL.Image import Exif
        exif = img.getexif()
        orientation = exif.get(274) if exif else None

        if orientation == 3:
            img = img.rotate(180, expand=True)
        elif orientation == 6:
            img = img.rotate(270, expand=True)
        elif orientation == 8:
            img = img.rotate(90, expand=True)
    except:
        pass

    max_side = 2000
    if max(img.size) > max_side:
        img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)

    return img

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def call_gemini_vision(image: Image.Image, prompt: str) -> str:
    """Call Gemini 3.5 Flash-Lite with vision (image + text prompt)."""
    client = genai.Client(api_key=API_KEY)

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[prompt, image]
    )

    return response.text

def extract_level1_json(image_path: str, bill_id: str) -> dict:
    """Extract Level 1 JSON from bill image."""
    cached = load_from_cache(bill_id, "level1")
    if cached:
        print(f"  [CACHED] {bill_id}")
        return cached

    print(f"  [EXTRACT L1] {bill_id}")
    image = preprocess_image(image_path)

    prompt = """You are an expert at reading Pakistani electricity bills (K-Electric, LESCO, IESCO).
Extract billing information from this bill image and return ONLY a valid JSON object (no markdown, no extra text).

Important extraction rules:
- Extract values exactly as printed. Do NOT recalculate, round, or correct amounts.
- Amounts are numbers in PKR. Remove Rs., commas, and currency labels: "Rs. 19,964" → 19964
- Credits and subsidies are NEGATIVE: "38209CR" → -38209
- Dates must be YYYY-MM-DD format. Example: "22nd Sep 2026" → "2026-09-22". Bill month is YYYY-MM.
- Provider: must be exactly KE, LESCO, or IESCO (NOT "KESC" - that's the filename, use "KE")
- Use null for: blank, covered by grey box, unreadable, or unavailable values
- NEVER include personal identifiers (names, addresses, CNIC, account numbers, meter numbers, consumer numbers, reference numbers)
- Charges: one entry per line in the charges section. Types: energy, fixed, fpa, quarterly_adjustment, surcharge, meter_rent, subsidy, other
- Taxes: one entry per line in the tax section. Types: gst, electricity_duty, income_tax, municipal_tax, other_tax
- payable_after_due_date: if multiple late-payment amounts shown, use the HIGHEST

Example output (from guide for KESC_0008):
{
  "provider": "KE",
  "tariff": "A1-R",
  "sanctioned_load_kw": 3,
  "bill_month": "2026-04",
  "reading_date": "2026-04-03",
  "issue_date": "2026-04-07",
  "due_date": "2026-04-21",
  "previous_reading": 8819,
  "current_reading": 8970,
  "units_consumed": 151,
  "charges": [
    {"type": "fixed", "amount": 900},
    {"type": "energy", "amount": 1054},
    {"type": "energy", "amount": 663.51},
    {"type": "quarterly_adjustment", "amount": 52.91},
    {"type": "fpa", "amount": 125.27},
    {"type": "surcharge", "amount": 64.93}
  ],
  "total_charges": 2860.62,
  "taxes": [
    {"type": "electricity_duty", "amount": 29.41},
    {"type": "gst", "amount": 520.21},
    {"type": "municipal_tax", "amount": 20}
  ],
  "total_taxes": 569.62,
  "current_bill": 3430.24,
  "arrears": -0.53,
  "payable_within_due_date": 3430,
  "payable_after_due_date": 3716
}

Now extract the bill in the image."""

    response_text = call_gemini_vision(image, prompt)

    try:
        json_obj = json.loads(response_text)
    except json.JSONDecodeError:
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_obj = json.loads(response_text[json_start:json_end])
        else:
            raise ValueError(f"Could not parse JSON from response: {response_text[:200]}")

    save_to_cache(bill_id, "level1", json_obj)
    return json_obj

def extract_facts_json(image_path: str, bill_id: str) -> dict:
    """Extract raw data facts for Level 2 question answering."""
    cached = load_from_cache(bill_id, "facts")
    if cached:
        print(f"  [CACHED FACTS] {bill_id}")
        return cached

    print(f"  [EXTRACT FACTS] {bill_id}")
    image = preprocess_image(image_path)

    prompt = """You are reading a Pakistani electricity bill. Extract raw data needed for question answering.
Return ONLY valid JSON (no markdown, no extra text).

Extract:
1. usage_history: array of {month: "YYYY-MM", units: number} for all months shown
2. billing_history: array of {month: "YYYY-MM", billed_amount: number, payment: number}
3. slab_rates: array of {units_from: number, units_to: number, rate_per_unit: number} (pricing tiers if shown)
4. energy_percentage: number (if bill shows energy as % of total)
5. tax_percentage: number (if bill shows tax as % of total)
6. printed_values: object with any other printed numeric values (fuel adjustment, surcharge rates, etc.)

Example:
{
  "usage_history": [
    {"month": "2025-07", "units": 239},
    {"month": "2025-08", "units": 203},
    {"month": "2026-04", "units": 151}
  ],
  "billing_history": [
    {"month": "2025-07", "billed_amount": 2577, "payment": 2577}
  ],
  "slab_rates": [
    {"units_from": 0, "units_to": 300, "rate_per_unit": 7.0}
  ],
  "energy_percentage": 83.39,
  "tax_percentage": 16.61,
  "printed_values": {}
}

Now extract all facts from the bill."""

    response_text = call_gemini_vision(image, prompt)

    try:
        json_obj = json.loads(response_text)
    except json.JSONDecodeError:
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_obj = json.loads(response_text[json_start:json_end])
        else:
            json_obj = {
                "usage_history": [],
                "billing_history": [],
                "slab_rates": [],
                "energy_percentage": None,
                "tax_percentage": None,
                "printed_values": {}
            }

    save_to_cache(bill_id, "facts", json_obj)
    return json_obj
