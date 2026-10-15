import Section from "./Section";
import type { Bill } from "@/lib/bills";

const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 2 }));

export default function Results({ bills, unavailable, total }: { bills: Bill[]; unavailable: number; total: number }) {
  const pct = Math.round((unavailable / total) * 100);
  return (
    <Section id="results" eyebrow="Results" title={`Output on the ${bills.length} test bills`}
      lede="Read live from output/level1.csv at build time. Amounts in PKR; personal identifiers are never extracted.">
      <div className="mt-8 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-stone-500">
            <tr>
              {["Bill", "Provider", "Tariff", "Month"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
              {["Units", "Taxes", "Current bill", "After due"].map((h) => <th key={h} className="px-4 py-3 text-right font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {bills.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-medium">{b.id}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">{b.provider}</span></td>
                <td className="px-4 py-3">{b.tariff ?? "—"}</td>
                <td className="px-4 py-3">{b.month ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(b.units)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(b.taxes)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(b.currentBill)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(b.afterDue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-stone-500">
        Level 2 coverage: {total} answers generated; about {unavailable} ({pct}%) state that the bill does not show the requested information — by design the model must not invent figures.
      </p>
    </Section>
  );
}
