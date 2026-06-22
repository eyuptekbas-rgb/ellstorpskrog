"use client";

import { Suspense, useEffect, useState } from "react";
import AdminAccessGate from "@/components/admin/AdminAccessGate";
import {
  defaultAdminFeatures,
  type AdminFeatures,
} from "@/lib/tenant/admin-features";

export default function CustomerDisplayShell({ children }: { children: React.ReactNode }) {
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

  return (
    <Suspense fallback={null}>
      <AdminAccessGate
        features={context?.adminFeatures ?? defaultAdminFeatures()}
        bypassFeatures={context?.isPlatformAdmin ?? false}
        tenantActive={context?.tenantActive ?? true}
      >
        {children}
      </AdminAccessGate>
    </Suspense>
  );
}
