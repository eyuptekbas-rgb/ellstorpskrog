import { ArrowRight, ShoppingBag } from "lucide-react";

type Props = {
  totalItems: number;
  totalPrice: number;
  onOpenCart: () => void;
  onCheckout: () => void;
};

export default function FloatingCartButton({
  totalItems,
  totalPrice,
  onOpenCart,
  onCheckout,
}: Props) {
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-[var(--menu-space-6)] right-[var(--menu-space-4)] z-[var(--menu-z-floating-cart)] hidden flex-col items-end gap-[var(--menu-space-2)] sm:bottom-[var(--menu-space-8)] sm:right-[var(--menu-space-6)] lg:flex">
      <button
        type="button"
        onClick={onCheckout}
        className="inline-flex items-center gap-[var(--menu-space-2)] rounded-[var(--menu-radius-pill)] border border-[var(--menu-border-control)] bg-[var(--menu-control-glass)] px-[var(--menu-space-5)] py-[var(--menu-space-2-5)] text-sm font-semibold text-[var(--menu-text-primary)] shadow-[var(--menu-shadow-floating)] backdrop-blur-md transition hover:bg-[var(--menu-control-glass-hover)] active:scale-95"
      >
        Till kassan
        <ArrowRight size={16} />
      </button>

      <button
        type="button"
        onClick={onOpenCart}
        aria-label={`Varukorg, ${totalItems} artiklar`}
        className="relative flex h-14 w-14 items-center justify-center rounded-[var(--menu-radius-pill)] bg-[var(--brand-copper)] text-[var(--menu-text-primary)] shadow-[var(--menu-shadow-floating-accent)] transition hover:scale-105 hover:bg-[var(--menu-color-primary-hover)] active:scale-95"
      >
        <ShoppingBag size={22} />
        <span className="absolute -right-[var(--menu-space-1)] -top-[var(--menu-space-1)] flex h-6 min-w-6 items-center justify-center rounded-[var(--menu-radius-pill)] bg-[var(--brand-cream)] px-[var(--menu-space-1-5)] text-xs font-bold text-[var(--menu-color-page)]">
          {totalItems}
        </span>
      </button>

      <p className="rounded-[var(--menu-radius-pill)] border border-[var(--menu-border-control)] bg-[var(--menu-overlay-soft)] px-[var(--menu-space-3)] py-[var(--menu-space-1)] text-xs font-medium text-[color-mix(in_srgb,var(--menu-color-white)_80%,transparent)] backdrop-blur-md">
        {totalPrice} kr
      </p>
    </div>
  );
}
