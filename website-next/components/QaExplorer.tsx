"use client";
import { useState } from "react";
import type { Answer } from "@/lib/bills";

export default function QaExplorer({ answers }: { answers: Record<string, Answer[]> }) {
  const ids = Object.keys(answers);
  const [bill, setBill] = useState(ids[0]);
  const [open, setOpen] = useState<string | null>("Q1");

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose a bill">
        {ids.map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={id === bill}
            onClick={() => setBill(id)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              id === bill
                ? "border-emerald-700 bg-emerald-700 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950"
                : "border-stone-300 text-stone-600 hover:border-stone-500 dark:border-stone-700 dark:text-stone-400"
            }`}
          >
            {id}
          </button>
        ))}
      </div>
      <ul className="mt-6 divide-y divide-stone-200 dark:divide-stone-800">
        {answers[bill].map((a) => {
          const isOpen = open === a.questionId;
          return (
            <li key={a.questionId} className="py-4">
              <button
                onClick={() => setOpen(isOpen ? null : a.questionId)}
                aria-expanded={isOpen}
                className="flex w-full gap-4 text-left font-medium"
              >
                <span className="w-9 shrink-0 text-emerald-700 dark:text-emerald-400">{a.questionId}</span>
                <span className="flex-1">{a.question}</span>
                <span aria-hidden className="text-stone-400">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <p className="mt-2 pl-[52px] text-stone-600 dark:text-stone-400">{a.answer}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
