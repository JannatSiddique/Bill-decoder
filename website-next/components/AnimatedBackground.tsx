const bolts = [
  { left: "6%", size: 26, delay: "0s", dur: "15s" },
  { left: "22%", size: 18, delay: "4s", dur: "19s" },
  { left: "41%", size: 30, delay: "8s", dur: "16s" },
  { left: "58%", size: 20, delay: "2s", dur: "21s" },
  { left: "76%", size: 28, delay: "6s", dur: "17s" },
  { left: "90%", size: 16, delay: "10s", dur: "20s" },
];

export default function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-emerald-50 via-stone-50 to-amber-50">
      {/* drifting colour blobs */}
      <div className="absolute -left-32 -top-32 h-[34rem] w-[34rem] animate-float-a rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="absolute -right-40 top-1/4 h-[30rem] w-[30rem] animate-float-b rounded-full bg-amber-300/40 blur-3xl" />
      <div className="absolute -bottom-40 left-1/4 h-[32rem] w-[32rem] animate-float-c rounded-full bg-sky-300/35 blur-3xl" />

      {/* panning grid */}
      <div
        className="absolute inset-0 animate-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(4 120 87 / .09) 1px, transparent 1px), linear-gradient(to bottom, rgb(4 120 87 / .09) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* rising lightning bolts */}
      {bolts.map((b, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute -bottom-12 animate-rise fill-amber-400/70 stroke-amber-500/60"
          style={{ left: b.left, width: b.size, height: b.size, animationDelay: b.delay, animationDuration: b.dur }}
          strokeWidth="1.2"
          strokeLinejoin="round"
        >
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </svg>
      ))}
    </div>
  );
}
