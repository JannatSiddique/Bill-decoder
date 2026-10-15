import Reveal from "./Reveal";
export default function Section({
  id, eyebrow, title, lede, children,
}: { id: string; eyebrow: string; title: string; lede?: string; children?: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-stone-200/70 py-20">
      <Reveal className="mx-auto max-w-6xl px-5">
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-[.12em] text-emerald-700">{eyebrow}</p>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {lede && <p className="mt-3 max-w-[62ch] text-stone-600">{lede}</p>}
        {children}
      </Reveal>
    </section>
  );
}
