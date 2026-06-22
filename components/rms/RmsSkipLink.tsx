"use client";

export default function RmsSkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="rms-skip-link fixed left-4 top-4 z-[100] -translate-y-20 rounded-xl bg-[#b85c38] px-4 py-2 text-sm font-semibold text-white transition focus:translate-y-0 focus:outline-none"
    >
      Hoppa till innehåll
    </a>
  );
}
