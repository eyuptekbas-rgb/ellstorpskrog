"use client";

import { Suspense, useEffect, useState } from "react";
import AdminAccessGate from "@/components/admin/AdminAccessGate";
import RmsProviders from "@/components/rms/RmsProviders";
import {
  defaultAdminFeatures,
  type AdminFeatures,
} from "@/lib/tenant/admin-features";

export default function DeliveryShell({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<{
    adminFeatures: AdminFeatures;
    isPlatformAdmin: boolean;
    tenantActive: boolean;
  } | null>(null);

  useEffect(() => {
    void fetch("/api/admin/context")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setContext({
            adminFeatures: data.adminFeatures ?? defaultAdminFeatures(),
            isPlatformAdmin: data.isPlatformAdmin ?? false,
            tenantActive: data.tenant?.active ?? true,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  const adminFeatures = context?.adminFeatures ?? defaultAdminFeatures();
  const isPlatformAdmin = context?.isPlatformAdmin ?? false;
  const tenantActive = context?.tenantActive ?? true;

  return (
    <RmsProviders>
      <Suspense fallback={<div className="flex h-dvh items-center justify-center text-white/40">Laddar…</div>}>
        <AdminAccessGate
          features={adminFeatures}
          bypassFeatures={isPlatformAdmin}
          tenantActive={tenantActive}
        >
          {children}
        </AdminAccessGate>
      </Suspense>
    </RmsProviders>
  );
}
