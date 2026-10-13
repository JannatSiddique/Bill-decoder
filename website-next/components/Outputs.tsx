import Section from "./Section";

const levels = [
  { badge: "Level 1 · level1.csv", title: "Structured extraction", sub: "One JSON row per bill.", items: [
    "Provider, tariff, sanctioned load", "Bill month, reading, issue and due dates (YYYY-MM-DD)", "Previous / current reading and units consumed",
    "Itemised charges and taxes; subsidies as negatives", "Current bill, arrears, payable before / after due date", "No personal identifiers; null for unreadable values" ] },
  { badge: "Level 2 · level2.csv", title: "Plain-English Q&A", sub: "Twelve answers per bill, 120 rows for 10 bills.", items: [
    "Net-metering and fuel adjustment (FPA/FCA)", "Late-payment surcharges", "Usage vs. last year and vs. average",
    "Summer vs. winter and 3-month trend", "Payment history, forecast and budgeting", "English only; states clearly when the bill lacks the data" ] },
];

export default function Outputs() {
  return (
    <Section id="outputs" eyebrow="Outputs" title="Two levels of output">
      <div className="mt-9 grid gap-5 md:grid-cols-2">
        {levels.map((l) => (
          <div key={l.badge} className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">{l.badge}</span>
            <h3 className="mt-3 text-lg font-semibold">{l.title}</h3>
            <p className="text-stone-500">{l.sub}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-stone-600 dark:text-stone-400">
              {l.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
