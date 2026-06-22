"use client";

import { useRef } from "react";
import { Check, MapPin, Store } from "lucide-react";

export type OrderType = "afhentning" | "levering";

type Props = {
  orderType: OrderType;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  onChange: (type: OrderType) => void;
};

export default function OrderTypeSelector({
  orderType,
  pickupEnabled,
  deliveryEnabled,
  onChange,
}: Props) {
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const options = [
    pickupEnabled && {
      value: "afhentning" as const,
      icon: Store,
      title: "Avhämtning",
      description: "Hämta din order i restaurangen",
      eta: "~15 min",
    },
    deliveryEnabled && {
      value: "levering" as const,
      icon: MapPin,
      title: "Leverans",
      description: "Vi levererar till din adress",
      eta: "~30–45 min",
    },
  ].filter(Boolean) as Array<{
    value: OrderType;
    icon: typeof Store;
    title: string;
    description: string;
    eta: string;
  }>;

  const selectedIndex = options.findIndex((o) => o.value === orderType);

  // Arrow-key navigation for the radio group (WAI-ARIA radio pattern).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const count = options.length;
    if (count === 0) return;
    const base = selectedIndex < 0 ? 0 : selectedIndex;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (base + 1) % count;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (base - 1 + count) % count;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    else return;
    e.preventDefault();
    onChange(options[next].value);
    optionRefs.current[next]?.focus();
  };

  return (
    <section className="space-y-3">
      <div>
        <h2 id="order-type-heading" className="font-serif text-xl text-white">
          Hur vill du få maten?
        </h2>
        <p className="mt-1 text-sm text-white/55">Välj avhämtning eller hemleverans</p>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="order-type-heading"
        onKeyDown={handleKeyDown}
        className="grid gap-3 sm:grid-cols-2"
      >
        {options.map(({ value, icon: Icon, title, description, eta }, index) => {
          const selected = orderType === value;
          return (
            <button
              key={value}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(value)}
              className={`relative flex flex-col rounded-2xl border p-4 text-left transition ${
                selected
                  ? "border-[#b85c38] bg-[#b85c38]/10 shadow-lg shadow-[#b85c38]/10"
                  : "border-white/8 bg-[#1a1a1a] hover:border-white/15"
              }`}
            >
              {selected && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#b85c38] text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
              <div
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${
                  selected ? "bg-[#b85c38]/20 text-[#e8c4a8]" : "bg-white/5 text-white/60"
                }`}
              >
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <span className="font-semibold text-white">{title}</span>
              <span className="mt-0.5 text-xs text-white/55">{description}</span>
              <span className="mt-2 inline-flex w-fit rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-[#d4a574]">
                {eta}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
