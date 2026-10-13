import Section from "./Section";

export default function QuickStart() {
  return (
    <Section id="run" eyebrow="Run it" title="Quick start"
      lede="Python 3.10+ and a Google AI Studio API key in .env (API_KEY=…), then:">
      <pre className="mt-7 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-5 text-sm dark:border-stone-800 dark:bg-stone-900">{`pip install -r requirements.txt
python main.py \\
  --bills ../test/bills \\
  --level1-template ../test/csv/level1.csv \\
  --level2-template ../test/csv/level2.csv \\
  --out ../output`}</pre>
      <p className="mt-3 text-sm text-stone-500">Stack: google-genai · Pydantic · Pillow · tenacity · python-dotenv. Model: gemini-3.5-flash-lite.</p>
    </Section>
  );
}
