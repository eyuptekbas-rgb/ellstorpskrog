import { Loader2, Lock } from "lucide-react";
import type { PaymentMethod } from "./PaymentMethodSelector";

type Props = {
  totalPrice: number;
  loading: boolean;
  disabled: boolean;
  paymentMethod: PaymentMethod;
  formId: string;
  disabledReason?: string | null;
};

export default function StickyTotalBar({
  totalPrice,
  loading,
  disabled,
  paymentMethod,
  formId,
  disabledReason,
}: Props) {
  const label = loading
    ? paymentMethod === "kort"
      ? "Omdirigerar till betalning…"
      : "Skickar beställning…"
    : paymentMethod === "kort"
      ? "Betala säkert"
      : "Bekräfta beställning";

  const reasonId = "checkout-disabled-reason";
  const showReason = Boolean(disabledReason) && !loading;

  return (
    <div className="app-nav-blur fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)]">
      {showReason && (
        <div className="mx-auto max-w-lg px-4 pt-3 sm:px-6">
          <p
            id={reasonId}
            role="status"
            aria-live="polite"
            className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-200"
          >
            {disabledReason}
          </p>
        </div>
      )}
      <div className="mx-auto flex max-w-lg items-center gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
            <Lock size={10} />
            Totalt
          </p>
          <p className="font-serif text-2xl leading-none text-[#e8c4a8] sm:text-3xl">
            {totalPrice}
            <span className="ml-1 font-sans text-sm text-white/55">kr</span>
          </p>
        </div>
        <button
          type="submit"
          form={formId}
          disabled={disabled || loading}
          aria-describedby={showReason ? reasonId : undefined}
          className="btn-primary btn-sm flex min-w-[11rem] flex-1 !py-4 sm:max-w-[13rem] sm:flex-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {label}
        </button>
      </div>
    </div>
  );
}
