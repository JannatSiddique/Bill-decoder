# WattsMyBill — Architecture Overview

## What WattsMyBill Does

**Input:** Bill image (PNG/JPG) from K-Electric, LESCO, or IESCO  
**Output:** 
- **Level 1:** Structured JSON with 17 fields (provider, tariff, charges, taxes, amounts, dates, readings)
- **Level 2:** Plain-English answers to 12 customer questions

---

## Pipeline Flow

```
Bill Image
    ↓
[LLM] Extract Level 1 JSON → [Validate with Pydantic] → store in level1.csv
    ↓
[LLM] Extract Facts (usage history, slab rates, etc.)
    ↓
[Python] Compute stats (averages, percentages, counts)
    ↓
[LLM] Answer all 12 questions using pre-computed stats → store in level2.csv
```

**Key insight:** Python does ALL math. LLM only answers questions using supplied numbers.

---

## Module Breakdown

### 1. **config.py** — Environment Setup
```python
# Loads from .env:
MODEL_PROVIDER = "google"
MODEL_NAME = "gemini-3.5-flash-lite"
API_KEY = "your-key-here"
```

### 2. **validation.py** — Schema Enforcement
```python
# Pydantic models:
- BillLevel1: validates all 17 fields + nested charges/taxes arrays
- Charge: validates charge type in [energy, fixed, fpa, ...]
- Tax: validates tax type in [gst, electricity_duty, ...]
```
**Why:** Catches malformed JSON early. If LLM returns invalid data, we can retry or fallback.

### 3. **llm_client.py** — Vision API Client (Most Important)
```python
def preprocess_image():
    # - EXIF rotation
    # - Resize if > 2000px
    # - Convert to base64 JPEG

def extract_level1_json():
    # - Load from cache if exists
    # - Send image + prompt to Gemini
    # - Cache response to disk

def extract_facts_json():
    # - Extract usage history, billing history, slab rates
    # - Cache response
```
**Why caching?** Bill processing takes ~30s per image. If you re-run, cached responses are instant.

### 4. **extraction.py** — Level 1 Validation + Retry
```python
def extract_level1():
    for attempt in range(2):
        try:
            json = llm_extract()           # Call LLM
            validated = BillLevel1(**json) # Validate with Pydantic
            return validated.model_dump()  # Success!
        except ValidationError as e:
            if attempt == 1:
                return get_null_filled_json()  # Fallback
```
**Why retry?** Sometimes LLM makes small errors (typo in charge type). Retry with fresh attempt.

### 5. **stats.py** — Python Math Engine
```python
def compute_stats(facts, level1):
    # From facts:
    stats['avg_units'] = avg(usage_history)
    stats['max_units'] = max(usage_history)
    stats['months_above_200'] = count where units > 200
    stats['tax_percentage'] = (total_taxes / current_bill) * 100
    # etc.
    return stats  # Dict with all numbers pre-calculated
```
**Why Python math?** Ensures numbers are correct. LLM just reads and explains them.

### 6. **qa.py** — Level 2 Question Answering
```python
def answer_level2_questions():
    facts = extract_facts_json(image)
    stats = compute_stats(facts, level1)
    
    prompt = f"""
    Bill data: {level1}
    Pre-computed stats: {stats}
    Questions: {all_12_questions}
    """
    
    # One call to Gemini returns all 12 answers
    response = call_gemini_vision(image, prompt)
    return json.loads(response)  # {"Q1": "answer", "Q2": "answer", ...}
```
**Why one call?** Saves rate limits (Gemini free: 15 requests/min).

### 7. **csv_io.py** — File I/O
```python
def write_level1_results():
    # Read template (preserves column order)
    # Write bill_id, json (JSON on single line)
    # CSV module auto-escapes quotes

def write_level2_results():
    # Read template
    # Write bill_id, question_id, question, answer
```
**Why use csv module?** Handles escaping automatically. Safe.

### 8. **main.py** — Orchestration
```python
def run_pipeline(bills_dir, template1, template2, out_dir):
    for bill_id, image_path in all_bills:
        try:
            level1 = extract_level1(image_path, bill_id)
            answers = answer_level2_questions(image_path, bill_id, level1, questions)
            results[bill_id] = (level1, answers)
        except Exception as e:
            logger.error(f"Failed: {bill_id}")  # Log but continue
    
    write_level1_results(template1, results, output)
    write_level2_results(template2, results, output)
```
**Why error isolation?** If bill #5 fails, bills #1-4 and #6-10 still processed.

---

## Data Flow Example (KESC_0008)

### Step 1: Level 1 Extraction
```
Input:  KESC_0008.png
LLM:    "Extract this bill → JSON"
Output: {
  "provider": "KE",
  "tariff": "A1-R",
  "units_consumed": 151,
  "charges": [{type: "fixed", amount: 900}, {type: "energy", amount: 1054}, ...],
  "total_charges": 2860.62,
  "taxes": [{type: "gst", amount: 520.21}, ...],
  "current_bill": 3430.24,
  "arrears": -0.53,
  "payable_after_due_date": 3716
}
```

### Step 2: Facts Extraction
```
Input:  KESC_0008.png
LLM:    "Extract usage history, billing history, slab rates"
Output: {
  "usage_history": [
    {"month": "2025-07", "units": 239},
    {"month": "2025-08", "units": 203},
    {"month": "2026-04", "units": 151}
  ],
  "billing_history": [...],
  "slab_rates": [{"units_from": 0, "units_to": 300, "rate_per_unit": 7.0}]
}
```

### Step 3: Compute Stats (Python)
```python
stats = {
  "usage_history": [...],
  "avg_units": 197.67,  # (239 + 203 + 151) / 3
  "max_units": 239,
  "months_above_200": 2,  # July, August
  "tax_percentage": 16.6,  # (569.62 / 3430.24) * 100
  "energy_percentage": 83.4
}
```

### Step 4: Answer Questions (LLM uses stats)
```
Q1: "How much of my bill is taxes?"
LLM uses stats:
  → "Taxes are PKR 569.62 out of PKR 3430.24, or 16.6%.
     The bill shows 83.39% energy and 16.61% taxes."

Q2: "How many months above 200 units?"
LLM uses stats:
  → "Two months: July 2025 (239 units) and August 2025 (203 units)."

... (all 12 answers)
```

---

## Key Design Decisions

| Decision | Why |
|----------|-----|
| **No OCR, direct vision** | Simpler, fewer dependencies, fewer errors |
| **Python does all math** | Verifiable, testable, correct |
| **Few-shot with KESC_0008** | Guides LLM output format |
| **Cache to disk** | Re-runs are instant; resilient if API fails |
| **One L2 call per bill** | Saves rate limits (15 req/min free tier) |
| **Null for unavailable** | Correct null scores better than guessed data |
| **Per-bill error isolation** | One failure doesn't crash entire pipeline |

---

## Rate Limits & Costs

**Gemini Free Tier:**
- 15 requests/min
- 500 requests/day
- 250K tokens/min

**Cost per 10 test bills:**
- ~30 API calls (3 per bill: L1, facts, L2)
- Takes ~30-40 minutes
- Free tier sufficient

---

## Assumptions & Limitations

1. Level 2 questions come from the real template (`test/csv/level2.csv`)
2. **Urdu text:** Bill may have Urdu, but all answers in English
3. **Tilted bills:** Light preprocessing handles EXIF rotation
4. **No recalculation:** Trust printed values even if math seems wrong (per spec)
5. **Personal data:** Covered by grey boxes treated as null

---
