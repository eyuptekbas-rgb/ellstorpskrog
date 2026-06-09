"use client";

import Link from "next/link";
import { CalendarDays, Phone, ShoppingBag, Truck } from "lucide-react";
import { useReservation } from "@/components/ReservationProvider";

type Props = {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  phoneLink: string;
};

export default function QuickActions({
  pickupEnabled,
  deliveryEnabled,
  phoneLink,
}: Props) {
  const { openReservation } = useReservation();

  const actions = [
    {
      id: "menu",
      label: "Se menyn",
      sub: "Beställ direkt",
      href: "/menu",
      icon: ShoppingBag,
    },
    deliveryEnabled && {
      id: "delivery",
      label: "Hemleverans",
      sub: "30–45 min",
      href: "/menu",
      icon: Truck,
    },
    pickupEnabled && {
      id: "pickup",
      label: "Avhämtning",
      sub: "Klar på 20 min",
      href: "/menu",
      icon: ShoppingBag,
    },
    {
      id: "book",
      label: "Boka bord",
      sub: "Ät hos oss",
      onClick: openReservation,
      icon: CalendarDays,
    },
    {
      id: "phone",
      label: "Ring oss",
      sub: "Snabb hjälp",
      href: phoneLink,
      icon: Phone,
    },
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    sub: string;
    href?: string;
    onClick?: () => void;
    icon: typeof ShoppingBag;
  }>;

  const visible = actions.slice(0, 4);

  return (
    <section className="border-b border-white/[0.04] bg-[#0f0f0f] px-[var(--content-px)] pb-6 pt-2 lg:hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3">
        {visible.map(({ id, label, sub, href, onClick, icon: Icon }) => {
          const className =
            "flex flex-col gap-2.5 rounded-[var(--radius-card)] border border-white/[0.07] bg-white/[0.025] p-4 active:scale-[0.98] transition-transform";

          const inner = (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b85c38]/12 text-[#d4a574]">
                <Icon size={17} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight text-white/90">
                  {label}
                </p>
                <p className="mt-0.5 text-[10px] text-white/40">{sub}</p>
              </div>
            </>
          );

          if (href) {
            if (href.startsWith("tel:")) {
              return (
                <a key={id} href={href} className={className}>
                  {inner}
                </a>
              );
            }
            return (
              <Link key={id} href={href} className={className}>
                {inner}
              </Link>
            );
          }

          return (
            <button key={id} type="button" onClick={onClick} className={className}>
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}
