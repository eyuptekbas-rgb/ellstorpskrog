import { redirect } from "next/navigation";
import DashboardClient from "@/components/admin/dashboard/DashboardClient";
import { getDashboardStats } from "@/lib/admin/stats";
import { requireAdminTenantId } from "@/lib/tenant/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let tenantId: string;
  try {
    tenantId = await requireAdminTenantId();
  } catch (error) {
    if (error instanceof Error && error.message === "NO_TENANT_SELECTED") {
      redirect("/platform/tenants?error=no-tenant");
    }
    throw error;
  }

  const stats = await getDashboardStats(tenantId);

  return <DashboardClient initial={stats} />;
}
