import { NextResponse } from "next/server";
import { callGemini, parseJson } from "@/lib/gemini";
import { FACTS_PROMPT, LEVEL1_PROMPT } from "@/lib/prompts";
import { computeStats } from "@/lib/stats";
import { demoBillId, loadDemo } from "@/lib/bills";
import { allow } from "@/lib/ratelimit";

export const maxDuration = 60;

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BASE64 = 8_000_000; // ~6 MB image

export async function POST(req: Request) {
  let sampleId: string | null = null;
  try {
    const { image, name } = await req.json();
    sampleId = demoBillId(name);

    if (!image?.data || !ALLOWED.has(image.mimeType)) {
      return NextResponse.json({ error: "Upload a PNG, JPG or WebP image of a bill." }, { status: 400 });
    }
    if (image.data.length > MAX_BASE64) {
      return NextResponse.json({ error: "Image is too large (max ~6 MB)." }, { status: 413 });
    }
    if (!allow(req)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    // Always read the bill with the live model.
    const [l1, facts] = await Promise.all([
      callGemini(LEVEL1_PROMPT, image, true).then(parseJson<Record<string, unknown>>),
      callGemini(FACTS_PROMPT, image, true).then(parseJson<Record<string, unknown>>),
    ]);
    return NextResponse.json({ level1: l1, stats: computeStats(facts, l1), billId: sampleId, source: "live" });
  } catch (e) {
    // Only for known sample bills: fall back to the pipeline's saved extraction, and say so.
    if (sampleId) {
      const { level1, facts } = loadDemo(sampleId);
      return NextResponse.json({
        level1, stats: computeStats(facts, level1), billId: sampleId, source: "saved",
        notice: e instanceof Error ? e.message : "Live AI is unavailable.",
      });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Analysis failed." }, { status: 500 });
  }
}
