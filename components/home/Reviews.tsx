import { Quote, Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Anna Andersson",
    location: "Malmö",
    text: "Fantastisk kebabpizza och snabb service. Vi beställer hemleverans varje fredag — alltid varm och färsk!",
    rating: 5,
  },
  {
    name: "Erik Johansson",
    location: "Limhamn",
    text: "Mysig restaurang med riktigt bra priser. Personalen är trevlig och maten smakar hemlagat.",
    rating: 5,
  },
  {
    name: "Maria Svensson",
    location: "Malmö",
    text: "Enkel beställning online och smidig avhämtning. Margheritan är den bästa i stan!",
    rating: 5,
  },
];

export default function Reviews() {
  return (
    <section className="border-t border-white/[0.04] bg-[#0f0f0f] px-[var(--content-px)] py-[var(--section-py-mobile)] lg:py-[var(--section-py)]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center lg:mb-12">
          <p className="section-label mb-3 lg:mb-4">Omdömen</p>
          <h2 className="text-display text-2xl text-white sm:text-3xl lg:text-4xl">
            Det våra gäster säger
          </h2>
          <p className="text-body mx-auto mt-3 max-w-md text-sm text-white/45 sm:text-base">
            Tusentals nöjda gäster i Malmö — läs vad andra tycker om oss.
          </p>
        </div>

        <div className="-mx-[var(--content-px)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--content-px)] pb-1 scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0">
          {REVIEWS.map((review) => (
            <article
              key={review.name}
              className="card-premium relative w-[min(300px,82vw)] shrink-0 snap-start rounded-2xl p-5 transition hover:border-[#b85c38]/15 lg:w-auto lg:rounded-3xl lg:p-7"
            >
              <Quote
                size={32}
                className="mb-5 text-[#b85c38]/25"
                strokeWidth={1.25}
              />

              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="text-[#d4a574]"
                    fill="currentColor"
                  />
                ))}
              </div>

              <p className="mb-6 text-sm leading-relaxed text-white/65">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="border-t border-white/[0.06] pt-4">
                <p className="text-sm font-semibold text-white">{review.name}</p>
                <p className="mt-0.5 text-xs text-white/35">{review.location}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
