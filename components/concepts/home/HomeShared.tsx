"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

export function HomeWelcomeModal({
  restaurantName,
}: {
  restaurantName: string;
}) {
  const [showNews, setShowNews] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("newsSeen");
    if (!seen) queueMicrotask(() => setShowNews(true));
  }, []);

  const closeNews = () => {
    setShowNews(false);
    localStorage.setItem("newsSeen", "true");
  };

  if (!showNews) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-md">
      <div className="card-premium w-full max-w-sm space-y-5 rounded-3xl p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-copper)]/15 text-2xl">
          🍽️
        </div>
        <h3 className="font-serif text-2xl">Välkommen!</h3>
        <p className="text-sm leading-relaxed opacity-60">
          Beställ online eller besök oss på {restaurantName}.
        </p>
        <button type="button" onClick={closeNews} className="btn-primary w-full">
          Utforska menyn
        </button>
      </div>
    </div>
  );
}

export function HomeScrollTopFab() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!showTop) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Till toppen"
      className="fixed bottom-[calc(var(--bottom-nav-height)+var(--bottom-nav-fab-overflow)+env(safe-area-inset-bottom,0px)+1rem)] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-copper)] text-white shadow-lg lg:bottom-6"
    >
      <ChevronUp size={22} />
    </button>
  );
}
