import { parseOrderItemDisplay } from "@/lib/cart";

type Props = {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export default function OrderItemLine({
  productName,
  quantity,
  unitPrice,
  totalPrice,
}: Props) {
  const { name, options, note } = parseOrderItemDisplay(productName);

  return (
    <div className="flex items-start justify-between gap-3 text-sm bg-[#111] rounded-xl p-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {quantity}× {name}
        </p>
        {options.length > 0 && (
          <p className="mt-1 text-xs leading-relaxed text-[#e8c4a8]/75">
            + {options.join(" · ")}
          </p>
        )}
        {note && (
          <p className="mt-1 text-xs italic text-white/45">
            &ldquo;{note}&rdquo;
          </p>
        )}
        <p className="text-white/40 text-xs mt-1">{unitPrice} kr/st</p>
      </div>
      <span className="font-semibold text-[#b85c38] shrink-0">
        {totalPrice} kr
      </span>
    </div>
  );
}
