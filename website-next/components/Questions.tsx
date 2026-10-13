import Section from "./Section";
import QaExplorer from "./QaExplorer";
import type { Answer } from "@/lib/bills";

export default function Questions({ answers }: { answers: Record<string, Answer[]> }) {
  return (
    <Section id="questions" eyebrow="Level 2 explorer" title="The 12 questions, answered for every bill"
      lede="Pick a bill, then open a question to read the generated answer from output/level2.csv.">
      <div className="mt-8"><QaExplorer answers={answers} /></div>
    </Section>
  );
}
