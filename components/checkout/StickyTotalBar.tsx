import { Loader2, Lock } from "lucide-react";
import type { PaymentMethod } from "./PaymentMethodSelector";

type Props = {
  totalPrice: number;
  loading: boolean;
  disabled: boolean;
  paymentMethod: PaymentMethod;
  formId: string;
};

export default function StickyTotalBar({
  totalPrice,
  loading,
  disabled,
  paymentMethod,
  formId,
}: Props) {
  const label = loading
    ? paymentMethod === "kort"
      ? "Omdirigerar till betalning…"
      : "Skickar beställning…"
    : paymentMethod === "kort"
      ? "Betala säkert"
      : "Bekräfta beställning";

  return (
    <div className="app-nav-blur fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-center gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/32">
            <Lock size={10} />
            Totalt
          </p>
          <p className="font-serif text-2xl leading-none text-[#e8c4a8] sm:text-3xl">
            {totalPrice}
            <span className="ml-1 font-sans text-sm text-white/35">kr</span>
          </p>
        </div>
        <button
          type="submit"
          form={formId}
          disabled={disabled || loading}
          className="btn-primary btn-sm flex min-w-[11rem] flex-1 !py-4 sm:max-w-[13rem] sm:flex-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {label}
        </button>
      </div>
    </div>
  );
}
