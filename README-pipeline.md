# WattsMyBill — Pakistani Electricity Bill Decoder

This is the Python pipeline behind **WattsMyBill**, in the [`source/`](source/) folder. Run every command below from inside `source/` (`cd source`). The web app and chatbot are documented in [README-web.md](README-web.md).

An AI-powered system to extract structured data and answer questions about Pakistani electricity bills (K-Electric, LESCO, IESCO).

## Setup

**Python version:** 3.10 or later (developed and tested on 3.10)

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Set up API key

Copy `.env.example` to `.env` and add your Google API key:

```bash
cp .env.example .env
# Edit .env and set API_KEY=your-google-api-key-here
```

Get a free Gemini API key from [aistudio.google.com](https://aistudio.google.com):
1. Go to aistudio.google.com
2. Sign in with Google account
3. Click "Get API key" (bottom left)
4. Create API key in Default Gemini Project
5. Copy and paste into `.env`

## Running the Pipeline

### Full pipeline (Level 1 + Level 2)

```bash
python main.py \
  --bills <bills_folder> \
  --level1-template <level1.csv> \
  --level2-template <level2.csv> \
  --out <output_folder>
```

### Example with training data

```bash
python main.py \
  --bills ../train/bills \
  --level1-template ../test/csv/level1.csv \
  --level2-template ../test/csv/level2.csv \
  --out ../output
```

### Output

- `output/level1.csv` — Extracted bill details (10 rows for 10 bills)
- `output/level2.csv` — Question answers (120 rows: 10 bills × 12 questions)

## How It Works

### Architecture

1. **config.py** — Load API keys from .env
2. **validation.py** — Pydantic models for JSON schema validation
3. **llm_client.py** — Google Gemini vision API client with retry logic
   - Handles image preprocessing (EXIF rotation, resizing)
   - Caches responses to disk for cheap re-runs
4. **extraction.py** — Level 1 extraction with validation and error recovery
5. **stats.py** — Python-computed statistics (averages, percentages, counts)
6. **qa.py** — Level 2 question answering
   - Extracts raw facts from bill
   - Computes statistics
   - Sends all 12 questions in one call to save rate limits
7. **csv_io.py** — CSV reading/writing (Python `csv` module)
8. **main.py** — CLI orchestration

### Level 1: Structured Extraction

For each bill:
- Sends image + extraction prompt (includes KESC_0008 example from guide) to Gemini
- Gemini returns JSON with 17 fields
- Pydantic validates schema
- If invalid, logs error and falls back to null-filled JSON
- Results written to `level1.csv`

**Key rules enforced:**
- Extract as printed (no rounding or recalculation)
- Credits/subsidies as negative
- Dates in YYYY-MM-DD format
- No personal identifiers (names, addresses, CNIC, account numbers, meter numbers)
- Null for blank, covered, or unreadable values

### Level 2: Question Answering

For each bill:
1. Extract raw "facts" JSON (usage history, billing history, slab rates, percentages)
2. Python computes all statistics (averages, counts, percentages, differences)
3. Send to Gemini: bill image + Level 1 JSON + pre-computed stats + all 12 questions
4. Gemini answers all 12 questions using supplied numbers (never does own math)
5. Results written to `level2.csv`

**Key rules enforced:**
- English only
- Grounded in bill (no outside tariff knowledge)
- Label estimates and explain calculations
- No personal identifiers
- Clear statement if information unavailable

### Robustness

- **Retries:** Vision calls retry up to 3 times with exponential backoff
- **Caching:** Raw model responses cached to disk per bill; re-runs reuse cache
- **Error handling:** One failing bill doesn't crash pipeline; logged to error.log
- **Fallbacks:** Missing data → null (L1) or "could not be determined" (L2)

## Testing

Compare KESC_0008 output (in `output/level1.csv`) against guide section 5.7. Numbers within ±1, text/dates exact match.

## Template Notes

**Real templates:**
- `test/csv/level1.csv` — 10 bill IDs, empty json column
- `test/csv/level2.csv` — 120 rows (10 bills × 12 real questions), empty answer column

## AI Usage

**Models:**
- Google Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`)

**APIs:**
- Google AI Studio (via google-genai SDK)

**LLM calls:**
- Level 1 extraction: 1 call per bill (image + extraction prompt with schema + example)
- Level 2 facts: 1 call per bill (image + facts extraction prompt)
- Level 2 answers: 1 call per bill (bill data + pre-computed stats + all 12 questions)
- Total: ~3 calls per bill × 10 test bills = ~30 calls

**AI assistance:**
- Claude (VS Code): Generated architecture plan, helped develop all modules (8 Python files, validation, API integration)

**Other tools:**
- Pydantic (validation)
- Pillow (image processing)
- tenacity (retry logic)
- Python built-in: csv, json, pathlib, logging
- No external invoice extraction services (e.g., Azure prebuilt-invoice, Textract, Mindee)
- No local OCR (vision model reads images directly)

## Design Decisions

1. **Vision-only:** No OCR; Gemini reads bill images directly → simpler, fewer dependencies
2. **Python computes all math:** Level 2 LLM never does arithmetic → more reliable, easier to verify
3. **Few-shot prompt:** KESC_0008 example in every Level 1 call → guides output format
4. **Single L2 call per bill:** All 12 questions in one request → saves rate limits
5. **Caching to disk:** Model responses cached, enables cheap re-runs and resilient pipeline
6. **Loose validation fallback:** Invalid JSON → null-filled JSON (scores better than missing fields)
7. **Per-bill error isolation:** One failing bill logged and skipped, doesn't crash pipeline

## Limitations & Assumptions

- **Urdu text:** Bill may include Urdu labels, but all answers must be in English
- **Tilted/obscured bills:** Light preprocessing handles EXIF rotation and resizing; greyed-out fields treated as null

## Troubleshooting

**"API_KEY environment variable not set"**
- Set `API_KEY` in `.env` file (copy from `.env.example`)

**"Could not parse JSON from response"**
- LLM returned malformed JSON; check error.log
- Model will retry up to 3 times with exponential backoff

**Rate limit hit**
- Gemini free tier: 15 requests/min
- Add delay between runs or use paid tier

**Missing cache folder**
- `response_cache/` created automatically on first run
- Safe to delete; will be recreated next run

## File Structure

```
source/
├── config.py              # Load environment variables
├── validation.py          # Pydantic models
├── llm_client.py          # Gemini vision API client
├── extraction.py          # Level 1 extraction
├── stats.py               # Compute statistics
├── qa.py                  # Level 2 question answering
├── csv_io.py              # CSV I/O
├── main.py                # CLI & orchestration
├── requirements.txt       # Pinned versions
├── .env.example           # Template (don't commit .env)
├── .gitignore             # Exclude .env, __pycache__, etc.
├── test_api.py            # Quick Gemini API connectivity check
└── ARCHITECTURE.md        # Detailed design walkthrough
```

## Re-running

```bash
python main.py --bills ../test/bills --level1-template ../test/csv/level1.csv --level2-template ../test/csv/level2.csv --out ../output
```

Responses are cached in `response_cache/`. After changing `stats.py` or the Level 2 prompt, delete `response_cache/*_level2.json` to regenerate answers (Level 1 and facts caches can stay).
