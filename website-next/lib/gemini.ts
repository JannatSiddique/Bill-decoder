import fs from "node:fs";
import path from "node:path";

type Config = { apiKey: string; model: string };

let cached: Config | null = null;

// Reads API_KEY / MODEL_NAME from the process env, falling back to the Python
// project's source/.env so the key only has to live in one place.
function loadConfig(): Config {
  if (cached) return cached;
  let apiKey = process.env.API_KEY ?? process.env.GEMINI_API_KEY;
  let model = process.env.MODEL_NAME;
  if (!apiKey || !model) {
    try {
      const env = fs.readFileSync(path.join(process.cwd(), "..", "source", ".env"), "utf8");
      for (const line of env.split("\n")) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
        if (!m) continue;
        if (m[1] === "API_KEY" && !apiKey) apiKey = m[2];
        if (m[1] === "MODEL_NAME" && !model) model = m[2];
      }
    } catch {
      /* no .env available */
    }
  }
  if (!apiKey) {
    console.error("API_KEY is not set. Add it to website-next/.env.local, source/.env, or the host's environment variables.");
    throw new Error("Live AI is not configured on this server (API_KEY is missing).");
  }
  cached = { apiKey, model: model || "gemini-3.5-flash-lite" };
  return cached;
}

export type Image = { mimeType: string; data: string };

export async function callGemini(prompt: string, image?: Image, json = false): Promise<string> {
  const { apiKey, model } = loadConfig();
  const parts: unknown[] = [{ text: prompt }];
  if (image) parts.push({ inline_data: { mime_type: image.mimeType, data: image.data } });

  const body = JSON.stringify({
    contents: [{ role: "user", parts }],
    ...(json ? { generationConfig: { responseMimeType: "application/json" } } : {}),
  });

  // Retry transient failures (rate limit / overload) with exponential backoff, like the Python client.
  let res: Response | undefined;
  for (let attempt = 0; attempt < 4; attempt++) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body,
    });
    if (res.ok || ![429, 500, 502, 503, 504].includes(res.status)) break;
    await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt));
  }
  if (!res!.ok) {
    const text = await res!.text();
    throw new Error(
      [429, 503].includes(res!.status)
        ? "The AI service is busy right now. Please try again in a moment."
        : `Gemini API ${res!.status}: ${text.slice(0, 200)}`,
    );
  }
  const data = await res!.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

export function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}") + 1;
    if (s >= 0 && e > s) return JSON.parse(text.slice(s, e)) as T;
    throw new Error("Could not parse JSON from model response.");
  }
}
