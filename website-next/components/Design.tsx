import Section from "./Section";

const items = [
  ["Vision-only", "No OCR layer or third-party invoice service; the model reads the image directly."],
  ["Python computes all math", "Averages, percentages, trends and comparisons come from stats.py, never from the model."],
  ["Disk cache", "Raw responses are saved per bill and call type, so re-runs are instant and cost nothing."],
  ["Retries with backoff", "Up to 3 attempts with exponential backoff to handle rate limits and malformed output."],
  ["Per-bill isolation", "A failing bill is logged and skipped; the rest of the batch still completes."],
  ["Privacy by design", "Names, addresses, CNIC, account and meter numbers are excluded from every output."],
];

export default function Design() {
  return (
    <Section id="design" eyebrow="Design" title="Built to be cheap, repeatable and safe">
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400">{d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
