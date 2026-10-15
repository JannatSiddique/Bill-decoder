# WattsMyBill — web app

Next.js 16 + Tailwind CSS 4 front end for WattsMyBill, which reads Pakistani electricity bills
(K-Electric, LESCO, IESCO) and answers customer questions about them.

- **Home (`/`)** — what the project does, the pipeline, results table and the 12 questions.
- **Chatbot (`/chat`)** — upload (or drag in) a bill image, then ask one of the 12 questions or type your own.
  Sample bills are available to download or drag straight into the upload box.

## How the chatbot works

1. `POST /api/analyze` — two Gemini vision calls extract the 17 Level 1 fields and the usage/billing history.
2. `lib/stats.ts` — all arithmetic (averages, trends, seasonal totals, forecasts) is done in code, never by the model.
3. `POST /api/ask` — the model answers one question using the bill data and the pre-computed statistics.

This mirrors the Python pipeline in [`../source`](../source/README.md); `lib/stats.ts` is a port of `stats.py`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

The Gemini key is read from `API_KEY` (and the model from `MODEL_NAME`) in the environment, or from
`.env.local` in this folder. As a local convenience it falls back to `../source/.env`.

```
API_KEY=your-google-api-key-here
MODEL_NAME=gemini-3.5-flash-lite
```

## Data

The homepage reads the Python pipeline's output at build time:

| File | Used for |
|------|----------|
| `../output/level1.csv` | results table |
| `../output/level2.csv` | answer coverage stats |
| `../test/csv/level2.csv` | the 12 questions |
| `public/test-bills/` | downloadable sample bills |

Re-run the Python pipeline, then rebuild, to refresh the numbers.

## Build & deploy

```bash
npm run build && npm start
```

For hosting (for example Vercel, root directory `website-next`):

- Set `API_KEY` and `MODEL_NAME` as environment variables; never commit them.
- Copy the CSVs above into this folder, or enable access to files outside the root directory, because the app currently reads `../output` and `../test`.
- `/api/analyze` and `/api/ask` are unauthenticated and spend your Gemini quota, so add rate limiting or access control before making the site public.

## Project layout

```
app/            pages (/, /chat) and API routes (/api/analyze, /api/ask)
components/     Navbar, Hero, Pipeline, Outputs, Results, Questions, Design, ChatBot, Footer
lib/            bills.ts (CSV loading), gemini.ts (API client), prompts.ts, stats.ts
public/         sample bills
```
