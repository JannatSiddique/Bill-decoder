import { NextResponse } from "next/server";
import { callGemini, parseJson } from "@/lib/gemini";
import { FACTS_PROMPT, LEVEL1_PROMPT } from "@/lib/prompts";
import { computeStats } from "@/lib/stats";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BASE64 = 8_000_000; // ~6 MB image

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image?.data || !ALLOWED.has(image.mimeType)) {
      return NextResponse.json({ error: "Upload a PNG, JPG or WebP image of a bill." }, { status: 400 });
    }
    if (image.data.length > MAX_BASE64) {
      return NextResponse.json({ error: "Image is too large (max ~6 MB)." }, { status: 413 });
    }
    const [l1, facts] = await Promise.all([
      callGemini(LEVEL1_PROMPT, image, true).then(parseJson<Record<string, unknown>>),
      callGemini(FACTS_PROMPT, image, true).then(parseJson<Record<string, unknown>>),
    ]);
    return NextResponse.json({ level1: l1, stats: computeStats(facts, l1) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Analysis failed." }, { status: 500 });
  }
}
