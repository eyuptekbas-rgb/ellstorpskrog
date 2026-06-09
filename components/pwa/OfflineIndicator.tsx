"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex items-center gap-2 bg-amber-900/90 border border-amber-600/50 text-amber-100 text-xs font-medium px-4 py-2 rounded-full backdrop-blur-sm">
        <WifiOff size={14} />
        Du är offline — cachad sida visas
      </div>
    </div>
  );
}
