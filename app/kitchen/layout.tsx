import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import KitchenShell from "@/components/kitchen/KitchenShell";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { resolvePlatformAdminTenant } from "@/lib/tenant/resolve";
import "../../styles/kitchen.css";

export const metadata: Metadata = {
  title: "Kitchen Display",
  robots: { index: false, follow: false, nocache: true },
};

export default async function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user && isPlatformAdmin(session.user.role)) {
    const tenantResolution = await resolvePlatformAdminTenant();
    if (tenantResolution.status === "missing") {
      redirect("/platform/tenants");
    }
    if (tenantResolution.status === "invalid") {
      redirect("/platform/tenants?error=invalid-tenant");
    }
  }

  return <KitchenShell>{children}</KitchenShell>;
}
