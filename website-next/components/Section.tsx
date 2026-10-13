export default function Section({
  id, eyebrow, title, lede, children,
}: { id: string; eyebrow: string; title: string; lede?: string; children?: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-stone-200 py-20 dark:border-stone-800">
      <div className="mx-auto max-w-6xl px-5">
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-[.12em] text-emerald-700 dark:text-emerald-400">{eyebrow}</p>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {lede && <p className="mt-3 max-w-[62ch] text-stone-600 dark:text-stone-400">{lede}</p>}
        {children}
      </div>
    </section>
  );
}
