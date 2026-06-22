"use client";

import { Suspense, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminAccessGate from "@/components/admin/AdminAccessGate";
import { OfflineSyncBadge } from "@/components/offline/OfflineProvider";
import RmsProviders from "@/components/rms/RmsProviders";
import RmsSkipLink from "@/components/rms/RmsSkipLink";
import {
  defaultAdminFeatures,
  type AdminFeatures,
} from "@/lib/tenant/admin-features";

type AdminContext = {
  tenant: {
    name: string;
    primaryColor: string;
    active: boolean;
  } | null;
  isPlatformAdmin: boolean;
  adminFeatures: AdminFeatures;
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [context, setContext] = useState<AdminContext | null>(null);

  useEffect(() => {
    void fetch("/api/admin/context")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setContext(data);
      })
      .catch(() => undefined);
  }, []);

  const tenantName = context?.tenant?.name ?? "Restaurang";
  const accentColor = context?.tenant?.primaryColor ?? "#b85c38";
  const adminFeatures = context?.adminFeatures ?? defaultAdminFeatures();
  const isPlatformAdmin = context?.isPlatformAdmin ?? false;
  const tenantActive = context?.tenant?.active ?? true;

  return (
    <RmsProviders>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
      <RmsSkipLink targetId="admin-main" />
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        tenantName={tenantName}
        accentColor={accentColor}
        isPlatformAdmin={isPlatformAdmin}
        adminFeatures={adminFeatures}
      />

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
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              Admin
            </p>
            <p className="font-serif text-base leading-tight">{tenantName}</p>
          </div>
          <OfflineSyncBadge />
        </header>

        <main id="admin-main" className="mx-auto max-w-6xl">
          <Suspense
            fallback={
              <div className="p-8 text-center text-white/40">Laddar…</div>
            }
          >
            <AdminAccessGate
              features={adminFeatures}
              bypassFeatures={isPlatformAdmin}
              tenantActive={tenantActive}
            >
              {children}
            </AdminAccessGate>
          </Suspense>
        </main>
      </div>
      </div>
    </RmsProviders>
  );
}
