import { Quote, Star } from "lucide-react";
import type { GoogleReview } from "@/lib/home/google-review-data";

export default function Reviews({ reviews = [], googleUrl }: { reviews?: GoogleReview[]; googleUrl: string }) {
  const visible = reviews.filter(review => review.rating === 5 && review.text.trim()).slice(0, 3);
  if (!visible.length) return (
    <section aria-label="Google-recensioner" className="border-t border-white/[0.04] bg-[#0f0f0f] px-[var(--content-px)] py-10 text-center lg:py-16">
      <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#d4a574] underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4">
        Se våra recensioner på Google
      </a>
    </section>
  );
  return (
    <section className="border-t border-white/[0.04] bg-[#0f0f0f] px-[var(--content-px)] py-10 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 text-center lg:mb-10">
          <p className="section-label mb-3 lg:mb-4">Omdömen</p>
          <h2 className="text-display text-2xl text-white sm:text-3xl lg:text-4xl">
            Det våra gäster säger
          </h2>
          <p className="text-body mx-auto mt-3 max-w-md text-sm text-white/45 sm:text-base">
            Utvalda femstjärniga recensioner från Google Maps.
          </p>
        </div>

        <div className="-mx-[var(--content-px)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--content-px)] pb-1 scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0">
          {visible.map((review) => (
            <article
              key={review.id}
              className="card-premium relative flex w-[min(300px,82vw)] shrink-0 snap-start flex-col rounded-2xl p-5 transition hover:border-[#b85c38]/15 lg:w-auto lg:rounded-3xl lg:p-6"
            >
              <Quote
                size={32}
                className="mb-5 text-[#b85c38]/25"
                strokeWidth={1.25}
              />

              <div className="mb-4 flex gap-0.5" aria-label="5 av 5 stjärnor">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="text-[#d4a574]"
                    fill="currentColor"
                  />
                ))}
              </div>

              <p className="mb-5 flex-1 text-sm leading-relaxed text-white/65">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="border-t border-white/[0.06] pt-4">
                <p className="text-sm font-semibold text-white">{review.name}</p>
                <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-block text-xs text-white/55 underline underline-offset-4 hover:text-white">Google Maps</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
