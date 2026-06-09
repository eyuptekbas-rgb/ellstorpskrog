import { Minus, Plus, Trash2, X } from "lucide-react";
import type { CartItem } from "@/lib/cart";

type Props = {
  open: boolean;
  cart: CartItem[];
  totalPrice: number;
  onClose: () => void;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
};

export default function CartDrawer({
  open,
  cart,
  totalPrice,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
}: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex max-h-[88vh] flex-col rounded-t-3xl border-t border-[#b85c38]/25 bg-[#121212] shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Varukorg"
      >
        <div className="shrink-0 border-b border-white/8 px-5 pb-4 pt-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl text-white">Varukorg</h2>
              <p className="text-xs text-white/45 mt-0.5">
                {cart.length} {cart.length === 1 ? "rätt" : "rätter"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Stäng varukorg"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cart.length === 0 ? (
            <p className="py-12 text-center text-white/45">
              Din varukorg är tom
            </p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/8 bg-[#0f0f0f] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    <p className="mt-0.5 text-sm text-[#b85c38]">
                      {item.price} kr / st
                    </p>
                  </div>
                  <p className="shrink-0 font-serif text-lg text-[#e8c4a8]">
                    {item.price * item.quantity} kr
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#1a1a1a] p-1">
                    <button
                      type="button"
                      onClick={() => onDecrease(item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="min-w-[1.75rem] text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrease(item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#b85c38] text-white"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="inline-flex items-center gap-1.5 text-xs text-red-400/90 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                    Ta bort
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="shrink-0 border-t border-white/8 bg-[#0a0a0a] px-5 py-5 pb-10">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-white/55">Totalt</span>
              <span className="font-serif text-2xl text-[#e8c4a8]">
                {totalPrice} kr
              </span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="w-full rounded-2xl bg-[#b85c38] py-4 text-base font-semibold text-white shadow-lg shadow-[#b85c38]/25 transition hover:bg-[#a04f30] active:scale-[0.98]"
            >
              Gå till kassan — {totalPrice} kr
            </button>
          </div>
        )}
      </div>
    </>
  );
}
