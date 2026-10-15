import Section from "./Section";

const steps = [
  { t: "Extract Level 1", d: "Gemini reads the image with a few-shot example and returns JSON. Pydantic validates it; invalid output retries, then falls back to nulls.", tag: "LLM + validation", py: false },
  { t: "Extract facts", d: "A second call pulls raw usage history, billing history, payment history and slab rates from the bill.", tag: "LLM", py: false },
  { t: "Compute stats", d: "Averages, trends, seasonal totals, forecasts and percentages are calculated deterministically.", tag: "Python", py: true },
  { t: "Answer questions", d: "One call carries the image, Level 1 JSON, stats and all 12 questions, so the model explains numbers instead of computing them.", tag: "LLM", py: false },
];

export default function Pipeline() {
  return (
    <Section id="pipeline" eyebrow="Pipeline" title="Four steps, one rule: Python does the math."
      lede="Bills mix Urdu and English labels, tilted photos, usage tables and stacked surcharges. Each bill flows through the same four stages.">
      <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.t} className="rounded-2xl border border-stone-200 bg-white/90 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/10 p-5">
            <span className="mb-3 grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">{i + 1}</span>
            <h3 className="font-semibold">{s.t}</h3>
            <p className="mt-1.5 text-sm text-stone-600">{s.d}</p>
            <span className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.py ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{s.tag}</span>
          </li>
        ))}
      </ol>
      <p className="mt-6 rounded-r-xl border-l-4 border-emerald-700 bg-emerald-50 px-5 py-4">
        <strong>Why it matters:</strong> language models are unreliable at arithmetic. Pre-computing every figure makes answers verifiable and keeps the model grounded in what the bill shows.
      </p>
    </Section>
  );
}
