import Link from "next/link";
import {
  FolderOpen,
  Package,
  Settings,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

const actions: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    href: "/admin/products",
    label: "Produkter",
    description: "Meny & priser",
    icon: Package,
  },
  {
    href: "/admin/categories",
    label: "Kategorier",
    description: "Menystruktur",
    icon: FolderOpen,
  },
  {
    href: "/admin/orders",
    label: "Beställningar",
    description: "Alla ordrar",
    icon: ShoppingBag,
  },
  {
    href: "/admin/settings",
    label: "Inställningar",
    description: "Restauranginfo",
    icon: Settings,
  },
];

export default function QuickActions() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-serif text-xl text-white">Snabbåtgärder</h2>
        <p className="mt-0.5 text-sm text-white/45">Vanliga adminuppgifter</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-2xl border border-white/8 bg-gradient-to-b from-[#1a1a1a] to-[#141414] p-4 transition hover:border-[#b85c38]/30 hover:shadow-lg hover:shadow-black/20 sm:p-5"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#b85c38]/12 text-[#d4a574] transition group-hover:bg-[#b85c38]/20">
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <span className="font-semibold text-white">{label}</span>
            <span className="mt-0.5 text-xs text-white/40">{description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
