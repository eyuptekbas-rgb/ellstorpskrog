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

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-serif text-xl text-white">Hur vill du få maten?</h2>
        <p className="mt-1 text-sm text-white/45">Välj avhämtning eller hemleverans</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(({ value, icon: Icon, title, description, eta }) => {
          const selected = orderType === value;
          return (
            <button
              key={value}
              type="button"
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
              <span className="mt-0.5 text-xs text-white/45">{description}</span>
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
