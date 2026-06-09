import { Banknote, Check, CreditCard, Truck } from "lucide-react";
import type { OrderType } from "./OrderTypeSelector";

export type PaymentMethod = "kort" | "afhentning" | "levering_betalning";

type Props = {
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  stripeCardEnabled: boolean;
  onChange: (method: PaymentMethod) => void;
};

export default function PaymentMethodSelector({
  paymentMethod,
  orderType,
  stripeCardEnabled,
  onChange,
}: Props) {
  const options = [
    stripeCardEnabled && {
      value: "kort" as const,
      icon: CreditCard,
      title: "Kortbetalning",
      description: "Visa, Mastercard, Apple Pay via Stripe",
      badge: "Rekommenderas",
    },
    orderType === "afhentning" && {
      value: "afhentning" as const,
      icon: Banknote,
      title: "Betal vid avhämtning",
      description: "Kontant eller kort i restaurangen",
    },
    orderType === "levering" && {
      value: "levering_betalning" as const,
      icon: Truck,
      title: "Betal vid leverans",
      description: "Betala när maten anländer",
    },
  ].filter(Boolean) as Array<{
    value: PaymentMethod;
    icon: typeof CreditCard;
    title: string;
    description: string;
    badge?: string;
  }>;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-serif text-xl text-white">Betalningsmetod</h2>
        <p className="mt-1 text-sm text-white/45">Välj hur du vill betala</p>
      </div>

      <div className="space-y-2.5">
        {options.map(({ value, icon: Icon, title, description, badge }) => {
          const selected = paymentMethod === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className={`relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                selected
                  ? "border-[#b85c38] bg-[#b85c38]/10"
                  : "border-white/8 bg-[#1a1a1a] hover:border-white/15"
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  selected ? "bg-[#b85c38]/20 text-[#e8c4a8]" : "bg-white/5 text-white/60"
                }`}
              >
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{title}</span>
                  {badge && (
                    <span className="rounded-full bg-[#b85c38]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#d4a574]">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-xs text-white/45">{description}</span>
              </div>
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  selected
                    ? "border-[#b85c38] bg-[#b85c38] text-white"
                    : "border-white/20 bg-transparent"
                }`}
              >
                {selected && <Check size={11} strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
