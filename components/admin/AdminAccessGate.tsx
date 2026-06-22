"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  isAdminPathAllowed,
  type AdminFeatures,
} from "@/lib/tenant/admin-features";
import { posDebugLog } from "@/lib/debug/pos-emergency-debug";

type Props = {
  features: AdminFeatures;
  bypassFeatures: boolean;
  tenantActive: boolean;
  children: React.ReactNode;
};

export default function AdminAccessGate({
  features,
  bypassFeatures,
  tenantActive,
  children,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    posDebugLog("ADMIN ACCESS GATE", {
      pathname,
      tenantActive,
      bypassFeatures,
      allowed: isAdminPathAllowed(pathname, features, bypassFeatures),
    });
    if (!tenantActive && !bypassFeatures) {
      router.replace("/login?error=tenant-inactive");
      return;
    }

    if (!isAdminPathAllowed(pathname, features, bypassFeatures)) {
      const params = new URLSearchParams(window.location.search);
      params.set("error", "feature-disabled");
      router.replace(`/admin?${params.toString()}`);
    }
  }, [pathname, features, bypassFeatures, tenantActive, router]);

  if (!tenantActive && !bypassFeatures) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-center text-white/50">
        Kundens system är pausat.
      </div>
    );
  }

  if (!isAdminPathAllowed(pathname, features, bypassFeatures)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-center text-white/50">
        Denna funktion är inte aktiverad för ert konto.
      </div>
    );
  }

  return <>{children}</>;
}
