import json
from validation import BillLevel1
from llm_client import extract_level1_json as llm_extract

def extract_level1(image_path: str, bill_id: str) -> dict:
    """Extract Level 1 JSON with validation and retry on error."""
    max_retries = 2
    attempt = 0

    while attempt < max_retries:
        attempt += 1
        try:
            raw_json = llm_extract(image_path, bill_id)

            validated = BillLevel1(**raw_json)
            return validated.model_dump()

        except Exception as e:
            print(f"    Validation error (attempt {attempt}/{max_retries}): {str(e)[:100]}")
            if attempt >= max_retries:
                print(f"    [FALLBACK] Using null-filled JSON for {bill_id}")
                return get_null_filled_json()

def get_null_filled_json() -> dict:
    """Fallback: return JSON with all fields but mostly null."""
    return {
        "provider": None,
        "tariff": None,
        "sanctioned_load_kw": None,
        "bill_month": None,
        "reading_date": None,
        "issue_date": None,
        "due_date": None,
        "previous_reading": None,
        "current_reading": None,
        "units_consumed": None,
        "charges": [],
        "total_charges": None,
        "taxes": [],
        "total_taxes": None,
        "current_bill": None,
        "arrears": None,
        "payable_within_due_date": None,
        "payable_after_due_date": None
    }
