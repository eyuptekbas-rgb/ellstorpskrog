import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminShell from "@/app/admin/AdminShell";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { resolvePlatformAdminTenant } from "@/lib/tenant/resolve";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
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

  return <AdminShell>{children}</AdminShell>;
}
