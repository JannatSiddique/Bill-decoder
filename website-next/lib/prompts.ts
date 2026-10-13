export const LEVEL1_PROMPT = `You are an expert at reading Pakistani electricity bills (K-Electric, LESCO, IESCO).
Extract billing information from this bill image and return ONLY a valid JSON object (no markdown, no extra text).

Important extraction rules:
- Extract values exactly as printed. Do NOT recalculate, round, or correct amounts.
- Amounts are numbers in PKR. Remove Rs., commas, and currency labels: "Rs. 19,964" -> 19964
- Credits and subsidies are NEGATIVE: "38209CR" -> -38209
- Dates must be YYYY-MM-DD format. Example: "22nd Sep 2026" -> "2026-09-22". Bill month is YYYY-MM.
- Provider: must be exactly KE, LESCO, or IESCO
- Use null for: blank, covered by grey box, unreadable, or unavailable values
- NEVER include personal identifiers (names, addresses, CNIC, account numbers, meter numbers, consumer numbers, reference numbers)
- Charges: one entry per line in the charges section. Types: energy, fixed, fpa, quarterly_adjustment, surcharge, meter_rent, subsidy, other
- Taxes: one entry per line in the tax section. Types: gst, electricity_duty, income_tax, municipal_tax, other_tax
- payable_after_due_date: if multiple late-payment amounts shown, use the HIGHEST

Example output:
{
  "provider": "KE", "tariff": "A1-R", "sanctioned_load_kw": 3, "bill_month": "2026-04",
  "reading_date": "2026-04-03", "issue_date": "2026-04-07", "due_date": "2026-04-21",
  "previous_reading": 8819, "current_reading": 8970, "units_consumed": 151,
  "charges": [{"type": "fixed", "amount": 900}, {"type": "energy", "amount": 1054}, {"type": "fpa", "amount": 125.27}],
  "total_charges": 2860.62,
  "taxes": [{"type": "electricity_duty", "amount": 29.41}, {"type": "gst", "amount": 520.21}],
  "total_taxes": 569.62, "current_bill": 3430.24, "arrears": -0.53,
  "payable_within_due_date": 3430, "payable_after_due_date": 3716
}

Now extract the bill in the image.`;

export const FACTS_PROMPT = `You are reading a Pakistani electricity bill. Extract raw data needed for question answering.
Return ONLY valid JSON (no markdown, no extra text).

Extract:
1. usage_history: array of {month: "YYYY-MM", units: number} for all months shown
2. billing_history: array of {month: "YYYY-MM", billed_amount: number, payment: number}
3. slab_rates: array of {units_from: number, units_to: number, rate_per_unit: number} (pricing tiers if shown)
4. energy_percentage: number (if bill shows energy as % of total)
5. tax_percentage: number (if bill shows tax as % of total)
6. printed_values: object with any other printed numeric values (fuel adjustment, surcharge rates, etc.)

Example:
{"usage_history": [{"month": "2025-07", "units": 239}], "billing_history": [{"month": "2025-07", "billed_amount": 2577, "payment": 2577}],
 "slab_rates": [{"units_from": 0, "units_to": 300, "rate_per_unit": 7.0}], "energy_percentage": 83.39, "tax_percentage": 16.61, "printed_values": {}}

Now extract all facts from the bill.`;

export function answerPrompt(question: string, stats: unknown, level1: unknown) {
  return `You are answering a customer question about a Pakistani electricity bill.
Rules:
- Answer ONLY in English, in 1-4 short sentences
- Ground every answer in information from the bill. Do NOT use outside tariff knowledge.
- Use ONLY the pre-computed numbers below. Never do your own math.
- For comparisons (higher/lower, up/down, same), use the direction fields in the statistics. Never compare numbers yourself.
- Questions about averages, trends, summer vs winter, forecasts, monthly budgeting and "same units" bills are answered from the statistics (forecast_next_month_units, monthly_budget, estimate_same_units_bill, etc.). Give the number and label it as an estimate.
- Only say the bill doesn't show a value when the matching statistic is null or empty.
- Do NOT include personal identifiers (names, addresses, CNIC, account numbers, etc.)

Pre-computed statistics you MUST use:
${JSON.stringify(stats, null, 2)}

Bill Level 1 data:
${JSON.stringify(level1, null, 2)}

Question: ${question}

Return only the answer text.`;
}
