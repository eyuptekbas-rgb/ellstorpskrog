import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import type { FeaturedDish } from "@/lib/home/featured";

type Props = {
  dishes: FeaturedDish[];
};

export default function FeaturedDishes({ dishes }: Props) {
  if (dishes.length === 0) return null;

  return (
    <section className="px-[var(--content-px)] py-[var(--section-py-mobile)] lg:py-[var(--section-py)]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4 lg:mb-14 lg:gap-6">
          <div>
            <p className="section-label mb-3 lg:mb-4">Från köket</p>
            <h2 className="text-display text-[1.75rem] text-white sm:text-3xl lg:text-[2.85rem]">
              Populära rätter
            </h2>
            <p className="text-body mt-2 max-w-md text-sm text-white/48 sm:mt-3 lg:mt-4 lg:text-base">
              Våra gästers favoriter — handplockade från menyn.
            </p>
          </div>
          <Link
            href="/menu"
            className="btn-secondary btn-sm hidden shrink-0 sm:inline-flex"
          >
            Se hela menyn
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="-mx-[var(--content-px)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--content-px)] pb-1 scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:overflow-visible lg:px-0 xl:grid-cols-3">
          {dishes.map((dish, index) => (
            <article
              key={dish.id}
              className="card-premium card-premium-hover group w-[min(280px,78vw)] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)] lg:w-auto"
            >
              <div className="p-2.5 pb-0 lg:p-3 lg:pb-0">
                <div className="product-image-shell product-image-ring relative h-40 overflow-hidden rounded-2xl lg:h-52">
                  <ProductImage
                    src={dish.image}
                    categorySlug={dish.categorySlug}
                    alt={dish.name}
                    fill
                    overlay={false}
                    priority={index < 2}
                    className="object-cover transition duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 85vw, 33vw"
                  />
                  <div className="absolute left-4 top-4 z-[2] flex items-center gap-1 rounded-full border border-white/12 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-[#e8c4a8] backdrop-blur-md">
                    <Star size={11} fill="currentColor" />
                    Populär
                  </div>
                </div>
              </div>

              <div className="p-4 pt-4 lg:p-6 lg:pt-5">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
                  {dish.categoryName}
                </p>
                <h3 className="font-serif text-lg text-white lg:text-xl">{dish.name}</h3>
                <p className="text-body mt-1.5 line-clamp-2 text-sm text-white/48 lg:mt-2">
                  {dish.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4 lg:mt-6 lg:pt-5">
                  <span className="font-serif text-2xl text-[#e8c4a8]">
                    {dish.price}
                    <span className="ml-0.5 font-sans text-sm text-white/38">
                      kr
                    </span>
                  </span>
                  <Link
                    href="/menu"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b85c38] transition hover:text-[#d4a574]"
                  >
                    Beställ →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <Link
          href="/menu"
          className="btn-secondary btn-sm mt-6 flex w-full items-center justify-center lg:hidden"
        >
          Se hela menyn
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
