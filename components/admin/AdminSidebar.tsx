"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bell,
  CalendarDays,
  Clock,
  CreditCard,
  ExternalLink,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Monitor,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const mainNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Beställningar", icon: ShoppingBag },
  { href: "/admin/reservations", label: "Reservationer", icon: CalendarDays },
];

const catalogNav: NavItem[] = [
  { href: "/admin/products", label: "Produkter", icon: Package },
  { href: "/admin/categories", label: "Kategorier", icon: FolderOpen },
];

const settingsNav: NavItem[] = [
  { href: "/admin/settings", label: "Inställningar", icon: Settings },
  { href: "/admin/payments", label: "Betalningar", icon: CreditCard },
  { href: "/admin/opening-hours", label: "Öppettider", icon: Clock },
  { href: "/admin/delivery", label: "Leverans", icon: Truck },
  { href: "/admin/notifications", label: "E-post", icon: Bell },
  { href: "/admin/seo", label: "SEO", icon: Search },
  { href: "/admin/marketing", label: "Marknadsföring", icon: Megaphone },
  { href: "/admin/system", label: "System", icon: Monitor },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
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
          ? "bg-[#b85c38]/15 text-[#e8c4a8] ring-1 ring-[#b85c38]/25"
          : "text-white/55 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={18} strokeWidth={1.75} className={active ? "text-[#d4a574]" : ""} />
      {item.label}
    </Link>
  );
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

export default function AdminSidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-white/6 px-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#d4a574]">
            Admin
          </p>
          <p className="font-serif text-lg leading-tight text-white">Ellstorps Krog</p>
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
        <NavSection title="Översikt" items={mainNav} pathname={pathname} onNavigate={onClose} />
        <NavSection title="Meny" items={catalogNav} pathname={pathname} onNavigate={onClose} />
        <NavSection title="System" items={settingsNav} pathname={pathname} onNavigate={onClose} />
      </nav>

      <div className="space-y-1 border-t border-white/6 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={16} />
          Till webbplatsen
        </Link>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/login" })}
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
