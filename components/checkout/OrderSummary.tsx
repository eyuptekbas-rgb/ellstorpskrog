import ProductImage from "@/components/ui/ProductImage";
import type { CartItem } from "@/lib/cart";
import type { OrderType } from "./OrderTypeSelector";

type Props = {
  cart: CartItem[];
  subtotal: number;
  deliveryFee: number;
  totalPrice: number;
  orderType: OrderType;
  zoneName: string | null;
  minimumOrder: number;
  belowMinimum: boolean;
};

export default function OrderSummary({
  cart,
  subtotal,
  deliveryFee,
  totalPrice,
  orderType,
  zoneName,
  minimumOrder,
  belowMinimum,
}: Props) {
  return (
    <section className="card-premium overflow-hidden rounded-[var(--radius-card)]">
      <div className="border-b border-white/[0.06] bg-[#b85c38]/8 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-white">Din beställning</h2>
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-[#e8c4a8]">
            {cart.reduce((s, i) => s + i.quantity, 0)} st
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <ul className="space-y-4">
          {cart.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="product-image-ring relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#111]">
                  <ProductImage
                    src={item.image}
                    categorySlug={item.categorySlug ?? "pizza"}
                    alt={item.name}
                    fill
                    thumbnail
                    overlay={false}
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-medium leading-snug text-white/88">
                    {item.name}
                  </span>
                  <span className="text-xs text-white/38">
                    {item.quantity} × {item.price} kr
                  </span>
                </div>
              </div>
              <span className="shrink-0 font-serif text-lg text-[#e8c4a8]">
                {item.price * item.quantity}
                <span className="ml-0.5 font-sans text-xs text-white/35">
                  kr
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-2.5 border-t border-white/[0.06] pt-5 text-sm">
          <div className="flex justify-between text-white/50">
            <span>Delsumma</span>
            <span className="tabular-nums">{subtotal} kr</span>
          </div>
          {orderType === "levering" && deliveryFee > 0 && (
            <div className="flex justify-between text-white/50">
              <span>
                Leverans
                {zoneName ? ` (${zoneName})` : ""}
              </span>
              <span className="tabular-nums">{deliveryFee} kr</span>
            </div>
          )}
          {orderType === "levering" && deliveryFee === 0 && (
            <div className="flex justify-between text-emerald-400/85">
              <span>Gratis leverans</span>
              <span>0 kr</span>
            </div>
          )}
        </div>

        {belowMinimum && minimumOrder > 0 && (
          <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
            Minsta order: {minimumOrder} kr — du har {subtotal} kr
          </p>
        )}

        <div className="mt-5 flex items-end justify-between rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-4">
          <span className="text-sm font-medium text-white/45">
            Totalt att betala
          </span>
          <span className="font-serif text-3xl leading-none text-[#e8c4a8]">
            {totalPrice}
            <span className="ml-1 text-base font-sans text-white/35">kr</span>
          </span>
        </div>
      </div>
    </section>
  );
}
