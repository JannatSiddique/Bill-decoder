import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import { loadQuestions } from "@/lib/bills";

export const metadata: Metadata = {
  title: "Ask your bill — Bill Decoder",
  description: "Upload a Pakistani electricity bill image and ask questions about it.",
};

export default function ChatPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-emerald-700 dark:text-emerald-400">Chatbot</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Upload a bill, then ask anything</h1>
        <p className="mt-3 max-w-[62ch] text-stone-600 dark:text-stone-400">
          Works with K-Electric, LESCO and IESCO bills. Pick one of the standard questions or type your own.
          Numbers are calculated in code; the model only explains them.
        </p>
        <div className="mt-8">
          <ChatBot questions={loadQuestions()} />
        </div>
      </main>
      <Footer />
    </>
  );
}
