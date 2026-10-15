import Logo from "./Logo";

export default function Footer() {
  const col = "space-y-1.5 text-stone-600";
  return (
    <footer className="border-t border-stone-200 bg-white/80 py-12 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <a href="/" className="flex items-center gap-2.5 font-bold"><Logo /> Bill Decoder</a>
            <p className="mt-3 max-w-[36ch] text-sm text-stone-600">
              An AI-powered system for extracting structured data and answering questions about Pakistani electricity bills.
            </p>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500">Explore</h4>
            <ul className={col}>
              <li><a href="/#pipeline">Pipeline</a></li><li><a href="/#outputs">Outputs</a></li>
              <li><a href="/#results">Results</a></li><li><a href="/#questions">Questions</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500">Project</h4>
            <ul className={col}>
              <li><a href="/chat">Chatbot</a></li><li><a href="/#design">Design decisions</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-2 border-t border-stone-200 pt-5 text-sm text-stone-500">
          <span>© 2026 Bill Decoder — project qt-26</span>
          <span>Supports K-Electric, LESCO &amp; IESCO bills</span>
        </div>
      </div>
    </footer>
  );
}
