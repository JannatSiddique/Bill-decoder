import json
from llm_client import extract_facts_json, call_gemini_vision, preprocess_image, load_from_cache, save_to_cache

def answer_level2_questions(image_path: str, bill_id: str, level1_json: dict, questions: list) -> dict:
    """Answer all Level 2 questions in one Gemini call."""
    from stats import compute_stats

    cached = load_from_cache(bill_id, "level2")
    if cached:
        print(f"  [CACHED L2] {bill_id}")
        return cached

    print(f"  [EXTRACT L2] {bill_id}")

    facts = extract_facts_json(image_path, bill_id)
    stats = compute_stats(facts, level1_json)

    image = preprocess_image(image_path)

    questions_text = "\n".join([f"{q['question_id']}: {q['question']}" for q in questions])

    prompt = f"""You are answering customer questions about a Pakistani electricity bill.
Rules:
- Answer ONLY in English
- Ground every answer in information from the bill. Do NOT use outside tariff knowledge.
- Use ONLY the pre-computed numbers below. Never do your own math.
- For comparisons (higher/lower, up/down, same), use the direction fields in the statistics. Never compare numbers yourself.
- Questions about averages, trends, summer vs winter, forecasts, monthly budgeting and "same units" bills are answered from the statistics (forecast_next_month_units, monthly_budget, estimate_same_units_bill, etc.). Give the number and label it as an estimate.
- Only say the bill doesn't show a value when the matching statistic is null or empty.
- Label estimates and explain how you calculated them.
- Do NOT include personal identifiers (names, addresses, CNIC, account numbers, etc.)
- Be specific with numbers

Pre-computed statistics you MUST use:
{json.dumps(stats, indent=2)}

Bill Level 1 data:
{json.dumps(level1_json, indent=2)}

Answer these questions. Return ONLY valid JSON with keys as question_id and values as answer text:

{questions_text}

Return format:
{{
  "Q1": "answer text",
  "Q2": "answer text",
  ...
}}"""

    response_text = call_gemini_vision(image, prompt)

    try:
        answers = json.loads(response_text)
    except json.JSONDecodeError:
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            answers = json.loads(response_text[json_start:json_end])
        else:
            answers = {q['question_id']: "Could not be determined from the bill." for q in questions}

    save_to_cache(bill_id, "level2", answers)
    return answers
