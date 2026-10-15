import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export type Bill = {
  id: string;
  provider: string;
  tariff: string | null;
  month: string | null;
  units: number | null;
  taxes: number | null;
  currentBill: number | null;
  afterDue: number | null;
};

export type Answer = { questionId: string; question: string; answer: string };

export function loadBills(): Bill[] {
  const rows = parseCsv(fs.readFileSync(path.join(DATA_DIR, "level1.csv"), "utf8")).slice(1);
  return rows.map(([id, json]) => {
    const j = JSON.parse(json);
    return {
      id,
      provider: j.provider,
      tariff: j.tariff ?? null,
      month: j.bill_month ?? null,
      units: j.units_consumed ?? null,
      taxes: j.total_taxes ?? null,
      currentBill: j.current_bill ?? null,
      afterDue: j.payable_after_due_date ?? null,
    };
  });
}

export function loadAnswers(): Record<string, Answer[]> {
  const rows = parseCsv(fs.readFileSync(path.join(DATA_DIR, "level2.csv"), "utf8")).slice(1);
  const out: Record<string, Answer[]> = {};
  for (const [id, questionId, question, answer] of rows) {
    (out[id] ??= []).push({ questionId, question, answer });
  }
  return out;
}

const UNAVAILABLE = /(doesn't|does not) (show|provide)|could not be determined|not available/i;
export function countUnavailable(all: Record<string, Answer[]>) {
  const list = Object.values(all).flat();
  return { total: list.length, unavailable: list.filter((a) => UNAVAILABLE.test(a.answer)).length };
}

// The 12 customer questions, taken from the official Level 2 template.
export function loadQuestions(): { id: string; question: string }[] {
  const file = path.join(DATA_DIR, "questions.csv");
  const rows = parseCsv(fs.readFileSync(file, "utf8")).slice(1);
  const seen = new Map<string, string>();
  for (const [, id, question] of rows) if (!seen.has(id)) seen.set(id, question);
  return [...seen].map(([id, question]) => ({ id, question }));
}

const norm = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();

/** Bill ids that have saved pipeline results bundled in data/demo (used as a fallback only). */
export function demoBillId(fileName: unknown): string | null {
  if (typeof fileName !== "string") return null;
  const id = fileName.replace(/\.[^.]+$/, "").toUpperCase();
  const ok = fs.existsSync(path.join(DATA_DIR, "demo", `${id}_level1.json`)) && fs.existsSync(path.join(DATA_DIR, "demo", `${id}_facts.json`));
  return ok ? id : null;
}

export function loadDemo(id: string) {
  const read = (kind: string) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, "demo", `${id}_${kind}.json`), "utf8"));
  return { level1: read("level1"), facts: read("facts") };
}

/** Saved pipeline answer when `question` is one of the 12 standard questions. */
export function demoAnswer(id: string, question: string): string | null {
  const q = loadQuestions().find((x) => norm(x.question) === norm(question));
  if (!q) return null;
  return loadAnswers()[id]?.find((a) => a.questionId === q.id)?.answer ?? null;
}
