import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { answerPrompt } from "@/lib/prompts";
import { demoAnswer, demoBillId } from "@/lib/bills";
import { allow } from "@/lib/ratelimit";

export const maxDuration = 60;

export async function POST(req: Request) {
  let question = "";
  let sampleId: string | null = null;
  try {
    const body = await req.json();
    question = body.question;
    const { level1, stats, image } = body;
    sampleId = demoBillId(body.billId);

    if (typeof question !== "string" || !question.trim() || question.length > 500) {
      return NextResponse.json({ error: "Ask a question (max 500 characters)." }, { status: 400 });
    }
    if (!level1 || !stats) {
      return NextResponse.json({ error: "Upload and analyze a bill first." }, { status: 400 });
    }
    if (!allow(req)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    // Always generate the answer with the live model.
    const answer = await callGemini(answerPrompt(question.trim(), stats, level1), image?.data ? image : undefined);
    return NextResponse.json({ answer: answer.trim(), source: "live" });
  } catch (e) {
    // Fallback for standard questions on sample bills when live AI fails.
    const stored = sampleId && typeof question === "string" ? demoAnswer(sampleId, question) : null;
    if (stored) return NextResponse.json({ answer: stored, source: "saved" });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not answer." }, { status: 500 });
  }
}
