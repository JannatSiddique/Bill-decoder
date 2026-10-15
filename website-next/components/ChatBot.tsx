"use client";
import { useRef, useState } from "react";

type Question = { id: string; question: string };
type Msg = { role: "user" | "bot" | "error"; text: string; tag?: string };
type Analysis = { level1: Record<string, unknown>; stats: Record<string, unknown>; billId: string | null; source: "live" | "saved"; notice?: string };
type Img = { mimeType: string; data: string; url: string; name: string };

// Downscale large photos so uploads stay small and fast.
async function toImage(file: File): Promise<Img> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL("image/jpeg", 0.85);
  return { mimeType: "image/jpeg", data: url.split(",")[1], url, name: file.name };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}

export default function ChatBot({ questions, samples }: { questions: Question[]; samples: string[] }) {
  const [image, setImage] = useState<Img | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "ready" | "failed">("idle");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const scroll = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessages([{ role: "error", text: "Please choose an image file (PNG or JPG)." }]);
      return;
    }
    setAnalysis(null);
    setMessages([]);
    setStatus("analyzing");
    try {
      const img = await toImage(file);
      setImage(img);
      const result = await post<Analysis>("/api/analyze", { name: file.name, image: { mimeType: img.mimeType, data: img.data } });
      setAnalysis(result);
      setStatus("ready");
      setMessages([
        result.source === "live"
          ? { role: "bot", text: "I've read your bill with live AI. Pick a question below or type your own.", tag: "Live AI" }
          : { role: "bot", text: "Live AI isn't available right now, so I loaded this sample bill's saved results. Answers to the 12 standard questions will also be saved results.", tag: "Saved result" },
      ]);
    } catch (e) {
      setStatus("failed");
      setMessages([{ role: "error", text: e instanceof Error ? e.message : "Could not read the bill." }]);
    }
    scroll();
  }

  // Sample bills can be dragged from the list straight onto the drop zone.
  async function handleDrop(dt: DataTransfer) {
    const sample = dt.getData("application/x-sample-bill");
    if (!sample) return handleFile(dt.files[0]);
    try {
      const res = await fetch(`/test-bills/${encodeURIComponent(sample)}`);
      if (!res.ok) throw new Error("Could not load the sample bill.");
      const blob = await res.blob();
      await handleFile(new File([blob], sample, { type: blob.type || "image/png" }));
    } catch (e) {
      setStatus("failed");
      setMessages([{ role: "error", text: e instanceof Error ? e.message : "Could not load the sample bill." }]);
    }
  }

  async function ask(question: string) {
    const q = question.trim();
    if (!q || !analysis || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: q }]);
    scroll();
    try {
      const { answer, source } = await post<{ answer: string; source: "live" | "saved" }>("/api/ask", {
        question: q,
        level1: analysis.level1,
        stats: analysis.stats,
        billId: analysis.billId,
        image: image && { mimeType: image.mimeType, data: image.data },
      });
      setMessages((m) => [...m, { role: "bot", text: answer, tag: source === "live" ? "Live AI" : "Saved result (live AI unavailable)" }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "error", text: e instanceof Error ? e.message : "Something went wrong." }]);
    } finally {
      setBusy(false);
      scroll();
    }
  }

  const ready = status === "ready";

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Upload */}
      <aside>
        <div className="mb-4 rounded-2xl border border-stone-200 bg-white/90 p-4">
          <h2 className="text-sm font-semibold">Sample bills to test</h2>
          <p className="mb-3 text-xs text-stone-500">Drag a bill into the box below, or click to download it.</p>
          <ul className="grid grid-cols-2 gap-2">
            {samples.map((f) => (
              <li key={f}>
                <a
                  href={`/test-bills/${f}`}
                  download
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-sample-bill", f);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="flex items-center justify-between gap-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs text-stone-700 transition hover:border-emerald-600 hover:text-emerald-700"
                >
                  <span className="truncate">{f.replace(/\.\w+$/, "")}</span>
                  <span aria-hidden>⬇</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleDrop(e.dataTransfer); }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
            dragging ? "border-emerald-600 bg-emerald-50" : "border-stone-300 bg-white hover:border-emerald-600"
          }`}
        >
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {image ? <img src={image.url} alt="Uploaded bill" className="max-h-72 w-auto rounded-lg border border-stone-200" /> : (
            <>
              <span className="text-3xl" aria-hidden>🧾</span>
              <span className="mt-2 font-semibold">Drop a bill image here</span>
              <span className="text-sm text-stone-500">or click to browse · PNG, JPG</span>
            </>
          )}
        </label>
        <p className="mt-3 text-sm" role="status">
          {status === "analyzing" && <span className="text-amber-700">Reading your bill… this takes 10–30 seconds.</span>}
          {ready && <span className="text-emerald-700">✓ Bill ready — {image?.name}{analysis?.source === "live" ? " (read by live AI)" : " (saved result)"}</span>}
          {status === "failed" && <span className="text-red-700">Couldn&apos;t read this bill. Try another image.</span>}
          {status === "idle" && <span className="text-stone-500">Your image is sent only to the Gemini API to answer your questions.</span>}
        </p>
      </aside>

      {/* Chat */}
      <section className="flex min-h-[520px] flex-col rounded-2xl border border-stone-200 bg-white">
        <div className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite" style={{ maxHeight: 520 }}>
          {messages.length === 0 && (
            <p className="py-16 text-center text-stone-500">Upload a bill to start the conversation.</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] ${
                  m.role === "user"
                    ? "bg-emerald-700 text-white"
                    : m.role === "error"
                      ? "bg-red-50 text-red-800"
                      : "bg-stone-100"
                }`}
              >
                {m.text}
                {m.tag && <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-stone-400">{m.tag}</div>}
              </div>
            </div>
          ))}
          {busy && <div className="text-sm text-stone-500">Thinking…</div>}
          <div ref={endRef} />
        </div>

        <div className="border-t border-stone-200 p-4">
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {questions.map((q) => (
              <button
                key={q.id}
                disabled={!ready || busy}
                onClick={() => ask(q.question)}
                title={q.question}
                className="truncate rounded-lg border border-stone-300 px-3 py-1.5 text-left text-xs text-stone-700 transition enabled:hover:border-emerald-600 enabled:hover:text-emerald-700 disabled:opacity-40"
              >
                <span className="font-semibold text-emerald-700">{q.id}</span> {q.question}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!ready || busy}
              maxLength={500}
              placeholder={ready ? "Ask about your bill…" : "Upload a bill first"}
              className="flex-1 rounded-lg border border-stone-300 bg-transparent px-3 py-2.5 outline-none focus:border-emerald-600 disabled:opacity-50"
            />
            <button
              disabled={!ready || busy || !input.trim()}
              className="rounded-lg bg-emerald-700 px-5 font-semibold text-white disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
