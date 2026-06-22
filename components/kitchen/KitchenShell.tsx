"use client";

import { Suspense, useEffect, useState } from "react";
import AdminAccessGate from "@/components/admin/AdminAccessGate";
import { OfflineSyncBadge } from "@/components/offline/OfflineProvider";
import RmsProviders from "@/components/rms/RmsProviders";
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

export default function KitchenShell({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<AdminContext | null>(null);

  useEffect(() => {
    void fetch("/api/admin/context")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setContext(data);
      })
      .catch(() => undefined);
  }, []);

  const adminFeatures = context?.adminFeatures ?? defaultAdminFeatures();
  const isPlatformAdmin = context?.isPlatformAdmin ?? false;
  const tenantActive = context?.tenant?.active ?? true;

  return (
    <RmsProviders>
      <Suspense
        fallback={
          <div className="flex h-dvh items-center justify-center bg-[#070707] text-white/40">
            Laddar…
          </div>
        }
      >
        <AdminAccessGate
          features={adminFeatures}
          bypassFeatures={isPlatformAdmin}
          tenantActive={tenantActive}
        >
          <div className="fixed right-4 top-4 z-50">
            <OfflineSyncBadge />
          </div>
          {children}
        </AdminAccessGate>
      </Suspense>
    </RmsProviders>
  );
}
