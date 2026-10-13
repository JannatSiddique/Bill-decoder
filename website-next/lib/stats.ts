/* eslint-disable @typescript-eslint/no-explicit-any */
// TypeScript port of source/stats.py — all arithmetic happens here, never in the model.

const avg = (v: number[]) => (v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null);
const r2 = (n: number) => Math.round(n * 100) / 100;
const dir = (d: number) => (d > 0 ? "higher" : d < 0 ? "lower" : "same");

export function computeStats(facts: any, level1: any) {
  const usageHistory: any[] = facts?.usage_history ?? [];
  const billing: any[] = facts?.billing_history ?? [];
  const currentUnits: number | null = level1?.units_consumed ?? null;
  const currentBill: number | null = level1?.current_bill ?? null;
  const totalCharges = level1?.total_charges ?? null;
  const totalTaxes = level1?.total_taxes ?? null;
  const billMonth: string | null = level1?.bill_month ?? null;

  const usage = usageHistory
    .filter((u) => u?.month && typeof u.units === "number")
    .sort((a, b) => String(a.month).localeCompare(String(b.month)));
  const units = usage.map((u) => u.units as number);
  const s: Record<string, any> = {};

  s.usage_history = usageHistory;
  s.avg_units = avg(units);
  s.max_units = units.length ? Math.max(...units) : null;
  s.max_units_month = usage.find((u) => u.units === s.max_units)?.month ?? null;
  s.min_units = units.length ? Math.min(...units) : null;
  s.min_units_month = usage.find((u) => u.units === s.min_units)?.month ?? null;
  s.months_above_200 = units.filter((u) => u > 200).length;

  if (currentUnits !== null && s.avg_units !== null) {
    const d = r2(currentUnits - s.avg_units);
    s.current_vs_avg_diff = d;
    s.current_vs_avg = dir(d);
  }

  const prevMonth = billMonth && /^\d{4}-\d{2}$/.test(billMonth) ? `${Number(billMonth.slice(0, 4)) - 1}-${billMonth.slice(5)}` : null;
  const lastYear = usage.find((u) => u.month === prevMonth)?.units ?? null;
  s.same_month_last_year = { month: prevMonth, units: lastYear };
  if (lastYear !== null && currentUnits !== null) {
    const d = r2(currentUnits - lastYear);
    s.same_month_last_year.difference = d;
    s.same_month_last_year.current_is = dir(d);
  }

  const recent = usage.slice(-3);
  s.last_3_months = recent;
  if (recent.length >= 2) {
    const d = recent[recent.length - 1].units - recent[0].units;
    s.last_3_months_change = r2(d);
    s.last_3_months_trend = d > 0 ? "up" : d < 0 ? "down" : "flat";
  }

  const season = (months: string[]) => {
    const list = usage.filter((u) => months.includes(String(u.month).slice(5, 7)));
    return { months: list.map((u) => u.month), total_units: list.reduce((a, u) => a + u.units, 0), avg_units_per_month: avg(list.map((u) => u.units)) };
  };
  s.summer = season(["06", "07", "08"]);
  s.winter = season(["12", "01", "02"]);
  if (s.summer.months.length && s.winter.months.length) {
    s.summer_minus_winter_avg_units_per_month = r2(s.summer.avg_units_per_month - s.winter.avg_units_per_month);
  }

  s.forecast_next_month_units = {
    method: "average of the months shown on the bill (estimate)",
    avg_all_months: s.avg_units,
    avg_last_3_months: avg(recent.map((u) => u.units)),
  };

  const paid: string[] = [];
  const unpaid: any[] = [];
  for (const b of billing) {
    if (typeof b?.billed_amount !== "number") continue;
    if (typeof b.payment === "number" && b.payment >= b.billed_amount - 1) paid.push(b.month);
    else unpaid.push({ month: b.month, billed_amount: b.billed_amount, payment: b.payment ?? null });
  }
  s.billing_history = billing;
  s.payments = { months_checked: paid.length + unpaid.length, paid_in_full: paid, short_or_missing: unpaid };

  const billed = billing.map((b) => b?.billed_amount).filter((n): n is number => typeof n === "number");
  if (billed.length) {
    s.monthly_budget = {
      method: `average billed amount over the ${billed.length} months shown on the bill (estimate)`,
      avg_monthly_bill: avg(billed),
      annual_estimate: r2((billed.reduce((a, b) => a + b, 0) / billed.length) * 12),
    };
  } else if (currentBill !== null) {
    s.monthly_budget = {
      method: "only the current bill is available, so it is used as the monthly figure (estimate)",
      avg_monthly_bill: currentBill,
      annual_estimate: r2(currentBill * 12),
    };
  }

  if (currentBill !== null) {
    s.estimate_same_units_bill = {
      method: "same units as this bill, assuming unchanged rates and no arrears (estimate)",
      estimated_bill: currentBill,
      cost_per_unit: currentUnits ? r2(currentBill / currentUnits) : null,
    };
  }

  if (totalCharges && currentBill) {
    s.tax_percentage = r2(((totalTaxes || 0) / currentBill) * 100);
    s.energy_percentage = r2((totalCharges / currentBill) * 100);
  } else {
    s.tax_percentage = facts?.tax_percentage ?? null;
    s.energy_percentage = facts?.energy_percentage ?? null;
  }

  s.slab_rates = facts?.slab_rates ?? [];
  s.current_units = currentUnits;
  s.total_charges = totalCharges;
  s.total_taxes = totalTaxes;
  s.current_bill = currentBill;
  return s;
}
