"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  Clock,
  CreditCard,
  Database,
  ExternalLink,
  FileSpreadsheet,
  LayoutDashboard,
  LayoutGrid,
  ListPlus,
  LogOut,
  Megaphone,
  Monitor,
  Package,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Timer,
  Truck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AdminFeatureId, AdminFeatures } from "@/lib/tenant/admin-features";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  feature?: AdminFeatureId;
};

const mainNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "Analys", icon: BarChart3, feature: "economy" },
  { href: "/admin/reports", label: "Rapporter", icon: FileSpreadsheet, feature: "economy" },
  { href: "/admin/orders", label: "Beställningar", icon: ShoppingBag, feature: "orders" },
  { href: "/admin/order-flow", label: "Orderflöde", icon: LayoutGrid, feature: "orders" },
  { href: "/admin/kitchen", label: "Köksdisplay", icon: Monitor, feature: "orders" },
  {
    href: "/admin/reservations",
    label: "Reservationer",
    icon: CalendarDays,
    feature: "reservations",
  },
  {
    href: "/admin/tables",
    label: "Bord & salong",
    icon: LayoutGrid,
    feature: "reservations",
  },
  {
    href: "/admin/customers",
    label: "Kunder",
    icon: Users,
    feature: "customers",
  },
  {
    href: "/admin/staff",
    label: "Personal",
    icon: Shield,
    feature: "staff",
  },
  {
    href: "/admin/shifts",
    label: "Skift",
    icon: Timer,
    feature: "staff",
  },
  {
    href: "/admin/ekonomi",
    label: "Ekonomi",
    icon: Wallet,
    feature: "economy",
  },
];

const catalogNav: NavItem[] = [
  { href: "/admin/menu", label: "Menyhantering", icon: Package, feature: "products" },
  { href: "/admin/extras", label: "Tillbehör", icon: ListPlus, feature: "extras" },
];

const settingsNav: NavItem[] = [
  { href: "/admin/restaurant", label: "Restaurant RMS", icon: Settings, feature: "settings" },
  { href: "/admin/terminals", label: "Terminaler", icon: Monitor, feature: "settings" },
  { href: "/admin/audit", label: "Auditlogg", icon: Shield, feature: "settings" },
  { href: "/admin/settings", label: "Inställningar", icon: Settings, feature: "settings" },
  { href: "/admin/payments", label: "Betalningar", icon: CreditCard, feature: "payments" },
  { href: "/admin/opening-hours", label: "Öppettider", icon: Clock, feature: "openingHours" },
  { href: "/admin/delivery", label: "Leverans", icon: Truck, feature: "delivery" },
  { href: "/admin/notifications", label: "E-post", icon: Bell, feature: "notifications" },
  { href: "/admin/seo", label: "SEO", icon: Search, feature: "seo" },
  { href: "/admin/marketing", label: "Marknadsföring", icon: Megaphone, feature: "marketing" },
  { href: "/admin/system", label: "System", icon: Monitor, feature: "system" },
  { href: "/admin/monitoring", label: "Monitoring", icon: Activity, feature: "system" },
  { href: "/admin/backup", label: "Backup", icon: Database, feature: "system" },
];

function filterNav(items: NavItem[], features: AdminFeatures, bypass: boolean) {
  return items.filter((item) => !item.feature || bypass || features[item.feature]);
}

type Props = {
  open: boolean;
  onClose: () => void;
  tenantName?: string;
  accentColor?: string;
  isPlatformAdmin?: boolean;
  adminFeatures?: AdminFeatures;
};

function NavLink({
  item,
  pathname,
  onNavigate,
  accentColor,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  accentColor: string;
}) {
  const active = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "text-white ring-1"
          : "text-white/55 hover:bg-white/5 hover:text-white"
      }`}
      style={
        active
          ? {
              backgroundColor: `${accentColor}26`,
              color: accentColor,
              boxShadow: `inset 0 0 0 1px ${accentColor}40`,
            }
          : undefined
      }
    >
      <Icon size={18} strokeWidth={1.75} style={active ? { color: accentColor } : undefined} />
      {item.label}
    </Link>
  );
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
  accentColor,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
  accentColor: string;
}) {
  return (
    <div>
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminSidebar({
  open,
  onClose,
  tenantName = "Restaurang",
  accentColor = "#b85c38",
  isPlatformAdmin = false,
  adminFeatures,
}: Props) {
  const pathname = usePathname();
  const bypass = isPlatformAdmin;
  const features = adminFeatures ?? ({} as AdminFeatures);
  const visibleMain = filterNav(mainNav, features, bypass);
  const visibleCatalog = filterNav(catalogNav, features, bypass);
  const visibleSettings = filterNav(settingsNav, features, bypass);

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-white/6 px-4">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            Admin
          </p>
          <p className="font-serif text-lg leading-tight text-white">{tenantName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Stäng meny"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <NavSection title="Översikt" items={visibleMain} pathname={pathname} onNavigate={onClose} accentColor={accentColor} />
        {visibleCatalog.length > 0 && (
          <NavSection title="Meny" items={visibleCatalog} pathname={pathname} onNavigate={onClose} accentColor={accentColor} />
        )}
        {visibleSettings.length > 0 && (
          <NavSection title="System" items={visibleSettings} pathname={pathname} onNavigate={onClose} accentColor={accentColor} />
        )}
      </nav>

      <div className="space-y-1 border-t border-white/6 p-3">
        {isPlatformAdmin && (
          <Link
            href="/platform/tenants"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#a78bfa] transition hover:bg-[#7c3aed]/10 hover:text-[#c4b5fd]"
          >
            <LayoutDashboard size={16} />
            Tillbaka till Ordina
          </Link>
        )}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={16} />
          Till webbplatsen
        </Link>
        <button
          type="button"
          onClick={() => {
            void fetch("/api/admin/audit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                category: "security",
                action: "Logout",
              }),
            }).finally(() => {
              void signOut({ callbackUrl: "/login" });
            });
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={16} />
          Logga ut
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-white/6 bg-[#0d0d0d] transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
