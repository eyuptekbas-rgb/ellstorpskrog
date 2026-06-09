"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-[min(18rem,85vw)]">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/6 bg-[#0a0a0a]/95 px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70"
            aria-label="Öppna meny"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#d4a574]">
              Admin
            </p>
            <p className="font-serif text-base leading-tight">Ellstorps Krog</p>
          </div>
        </header>

        <main className="mx-auto max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
