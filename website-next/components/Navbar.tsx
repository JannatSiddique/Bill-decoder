import Logo from "./Logo";

const links = [
  ["Pipeline", "/#pipeline"],
  ["Outputs", "/#outputs"],
  ["Results", "/#results"],
  ["Questions", "/#questions"],
  ["Design", "/#design"],
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/85 backdrop-blur dark:border-stone-800 dark:bg-stone-950/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <Logo /> Bill Decoder
        </a>
        <nav aria-label="Primary" className="flex items-center gap-6 text-sm">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="hidden text-stone-600 hover:text-stone-950 md:block dark:text-stone-400 dark:hover:text-white">
              {label}
            </a>
          ))}
          <a href="/chat" className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300">
            Try the chatbot
          </a>
        </nav>
      </div>
    </header>
  );
}
