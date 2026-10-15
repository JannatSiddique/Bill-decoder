import Section from "./Section";

export default function Questions({ questions }: { questions: { id: string; question: string }[] }) {
  return (
    <Section id="questions" eyebrow="Questions" title="The 12 questions you can ask"
      lede="You can test the chatbot only with these questions. Upload a bill, then pick any of them.">
      <ol className="mt-8 grid gap-3 md:grid-cols-2">
        {questions.map((q) => (
          <li key={q.id} className="flex gap-3 rounded-2xl border border-stone-200 bg-white/90 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/10 p-4">
            <span className="w-9 shrink-0 font-semibold text-emerald-700">{q.id}</span>
            <span>{q.question}</span>
          </li>
        ))}
      </ol>
      <a href="/chat" className="mt-7 inline-block rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">
        Try the chatbot
      </a>
    </Section>
  );
}
