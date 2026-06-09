import { Minus, Plus } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import type { MenuProduct } from "@/lib/menu";

type Props = {
  product: MenuProduct;
  categorySlug: string;
  quantity: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
};

export default function ProductCard({
  product,
  categorySlug,
  quantity,
  onAdd,
  onIncrease,
  onDecrease,
}: Props) {
  return (
    <article
      className={`card-premium card-premium-hover group relative overflow-hidden rounded-[var(--radius-card)] ${
        product.soldOut ? "opacity-80" : ""
      }`}
    >
      {product.soldOut && (
        <div className="absolute right-4 top-4 z-20">
          <span className="inline-flex items-center rounded-full border border-white/12 bg-black/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/80 backdrop-blur-md">
            Slutsåld
          </span>
        </div>
      )}

      <div className="p-3 pb-0 sm:p-4 sm:pb-0">
        <div className="product-image-shell product-image-ring relative aspect-[5/4] w-full overflow-hidden rounded-2xl sm:aspect-[4/3]">
          <ProductImage
            src={product.image}
            categorySlug={categorySlug}
            alt={product.name}
            fill
            overlay={false}
            className={`object-cover transition duration-700 ease-out group-hover:scale-[1.05] ${
              product.soldOut ? "grayscale-[40%] brightness-[0.75]" : ""
            }`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          <div className="absolute bottom-0 left-0 right-0 z-[2] p-5 sm:p-6">
            <h3 className="font-serif text-xl leading-tight text-white sm:text-2xl">
              {product.name}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/55">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/32">
            Pris
          </p>
          <p className="font-serif text-2xl leading-none text-[#e8c4a8] sm:text-[1.75rem]">
            {product.price}
            <span className="ml-1 font-sans text-sm font-normal text-white/38">
              kr
            </span>
          </p>
        </div>

        {product.soldOut ? (
          <div className="flex h-11 min-w-[7rem] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 text-xs text-white/35">
            Tillfälligt slut
          </div>
        ) : quantity > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 rounded-2xl border border-white/10 bg-[#111] p-1">
              <button
                type="button"
                onClick={onDecrease}
                aria-label="Minska antal"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 active:scale-95"
              >
                <Minus size={17} />
              </button>
              <span className="min-w-[2rem] text-center text-base font-semibold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={onIncrease}
                aria-label="Öka antal"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b85c38] text-white transition hover:bg-[#a04f30] active:scale-95"
              >
                <Plus size={17} />
              </button>
            </div>
            <p className="hidden text-sm font-semibold tabular-nums text-[#d4a574] sm:block">
              {product.price * quantity} kr
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="btn-primary btn-sm shrink-0 shadow-none"
          >
            <Plus size={16} />
            Lägg till
          </button>
        )}
      </div>
    </article>
  );
}
