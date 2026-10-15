const stats = [
  ["3", "Utilities supported"],
  ["17", "Fields extracted per bill"],
  ["12", "Questions answered per bill"],
  ["~3", "LLM calls per bill"],
];

export default function Hero() {
  return (
    <section id="top" className="mx-auto max-w-6xl px-5 pb-16 pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="mb-3 animate-fade-up text-xs font-semibold uppercase tracking-[.12em] text-emerald-700">
            K-Electric · LESCO · IESCO
          </p>
          <h1 className="animate-fade-up [animation-delay:.1s] text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
            Turn a photo of your electricity bill into{" "}
            <span className="text-shimmer animate-shimmer">clear answers</span>.
          </h1>
          <p className="mt-5 max-w-[52ch] animate-fade-up [animation-delay:.2s] text-lg text-stone-600">
            Pakistani Electricity Bill Decoder reads a bill image with a vision model, extracts 17 structured fields,
            and answers 12 customer questions in plain English — with all the math done in Python, not guessed by the model.
          </p>
          <div className="mt-7 flex animate-fade-up flex-wrap gap-3 [animation-delay:.3s]">
            <a href="/chat" className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">
              Upload a bill &amp; ask
            </a>
            <a href="#pipeline" className="rounded-lg border border-stone-300 px-5 py-3 font-semibold hover:bg-stone-100">
              How it works
            </a>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {["Gemini vision", "No OCR", "Pydantic validated", "Cached & resilient"].map((c) => (
              <span key={c} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600">
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white/90 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/10 p-5 font-mono text-[13px] leading-relaxed shadow-sm">
          <div className="mb-3 flex gap-1.5">
            {[0, 1, 2].map((i) => <i key={i} className="h-2.5 w-2.5 rounded-full bg-stone-200" />)}
          </div>
          <p className="text-stone-500">{"// KESC_0002.png → level1.json"}</p>
          <p>{"{"}</p>
          {[
            ["provider", '"KE"'],
            ["tariff", '"A1-R"'],
            ["bill_month", '"2026-09"'],
            ["units_consumed", "159"],
            ["total_charges", "6359.24"],
            ["total_taxes", "1261.29"],
            ["current_bill", "7620.53"],
            ["payable_after_due_date", "8257"],
          ].map(([k, v], i, a) => (
            <p key={k} className="pl-4">
              <span className="text-emerald-700">&quot;{k}&quot;</span>:{" "}
              <span className={v.startsWith('"') ? "" : "text-amber-700"}>{v}</span>
              {i < a.length - 1 && ","}
            </p>
          ))}
          <p>{"}"}</p>
        </div>
      </div>

      <dl className="mt-12 grid animate-fade-up [animation-delay:.5s] grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([n, label]) => (
          <div key={label} className="flex flex-col rounded-2xl border border-stone-200 bg-white/90 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/10 p-5">
            <dt className="order-2 text-sm text-stone-500">{label}</dt>
            <dd className="text-3xl font-bold tracking-tight text-emerald-700">{n}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
