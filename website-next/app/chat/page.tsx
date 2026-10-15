import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import { loadQuestions } from "@/lib/bills";
import fs from "node:fs";
import path from "node:path";

function loadSamples() {
  const dir = path.join(process.cwd(), "public", "test-bills");
  return fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
}

export const metadata: Metadata = {
  title: "Ask your bill — Bill Decoder",
  description: "Upload a Pakistani electricity bill image and ask questions about it.",
};

export default function ChatPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-emerald-700">Chatbot</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Upload a bill, then ask anything</h1>
        <p className="mt-3 max-w-[62ch] text-stone-600">
          Works with K-Electric, LESCO and IESCO bills. Pick one of the standard questions or type your own.
          Numbers are calculated in code; the model only explains them.
        </p>
        <div className="mt-8">
          <ChatBot questions={loadQuestions()} samples={loadSamples()} />
        </div>
      </main>
      <Footer />
    </>
  );
}
