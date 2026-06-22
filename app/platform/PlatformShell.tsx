"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import PlatformSidebar from "@/components/platform/PlatformSidebar";
import { ORDINA } from "@/lib/tenant/branding";

export default function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/platform/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen text-white" style={{ background: "#0a0612" }}>
      <PlatformSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72">
        <header
          className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 lg:hidden"
          style={{
            background: ORDINA.surface,
            borderColor: "rgba(167, 139, 250, 0.15)",
          }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5"
          >
            <Menu size={20} />
          </button>
          <span className="font-serif text-lg">{ORDINA.name}</span>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
