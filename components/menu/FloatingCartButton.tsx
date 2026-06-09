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
    <div className="fixed bottom-6 right-4 z-40 hidden flex-col items-end gap-2 sm:bottom-8 sm:right-6 sm:flex">
      <button
        type="button"
        onClick={onCheckout}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white shadow-xl shadow-black/40 backdrop-blur-md transition hover:bg-white/10 active:scale-95"
      >
        Till kassan
        <ArrowRight size={16} />
      </button>

      <button
        type="button"
        onClick={onOpenCart}
        aria-label={`Varukorg, ${totalItems} artiklar`}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#b85c38] text-white shadow-xl shadow-[#b85c38]/40 transition hover:bg-[#a04f30] hover:scale-105 active:scale-95"
      >
        <ShoppingBag size={22} />
        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#e8c4a8] px-1.5 text-xs font-bold text-[#0a0a0a]">
          {totalItems}
        </span>
      </button>

      <p className="rounded-full border border-white/10 bg-black/70 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-md">
        {totalPrice} kr
      </p>
    </div>
  );
}
