"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Building2,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Palette,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { ORDINA } from "@/lib/tenant/branding";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const nav: NavItem[] = [
  { href: "/platform", label: "Översikt", icon: LayoutDashboard, exact: true },
  { href: "/platform/tenants", label: "Kunder", icon: Building2 },
  { href: "/platform/ekonomi", label: "Ekonomi", icon: Wallet },
  { href: "/platform/design-concepts", label: "Designkoncept", icon: Palette },
];

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
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
          ? "bg-[#7c3aed]/20 text-[#c4b5fd] ring-1 ring-[#7c3aed]/30"
          : "text-white/55 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={18} strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

type Props = { open: boolean; onClose: () => void };

export default function PlatformSidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  const content = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-[#7c3aed]/20 px-4">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: ORDINA.accentMuted }}
          >
            Platform
          </p>
          <p className="font-serif text-lg leading-tight text-white">{ORDINA.name}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {nav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onClose} />
        ))}
      </nav>

      <div className="space-y-1 border-t border-[#7c3aed]/20 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={16} />
          Till webbplatsen
        </Link>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/platform/login" })}
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
      {open && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-[#7c3aed]/20 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: ORDINA.surface }}
      >
        {content}
      </aside>
    </>
  );
}
