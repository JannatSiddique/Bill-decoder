import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { answerPrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const { question, level1, stats, image } = await req.json();
    if (typeof question !== "string" || !question.trim() || question.length > 500) {
      return NextResponse.json({ error: "Ask a question (max 500 characters)." }, { status: 400 });
    }
    if (!level1 || !stats) {
      return NextResponse.json({ error: "Upload and analyze a bill first." }, { status: 400 });
    }
    const answer = await callGemini(answerPrompt(question.trim(), stats, level1), image?.data ? image : undefined);
    return NextResponse.json({ answer: answer.trim() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not answer." }, { status: 500 });
  }
}
