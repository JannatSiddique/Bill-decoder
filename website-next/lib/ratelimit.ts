// Small in-memory limiter for calls that spend the Gemini quota. It is per server
// instance (fine for a demo); use a shared store such as Redis for real traffic.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_CALLS = Number(process.env.RATE_LIMIT_PER_HOUR ?? 40);

export function allow(req: Request): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_CALLS) { hits.set(ip, recent); return false; }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}
