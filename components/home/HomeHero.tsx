"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone, Star, UtensilsCrossed } from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import { useTenantPublicPath } from "@/components/tenant/TenantPublicPathProvider";
import { resolveHeroImage } from "@/lib/brand/images";
import styles from "./HomeHero.module.css";

type Props = {
  restaurantName: string;
  heroImage: string;
  phone: string;
  phoneLink: string;
  isOpen: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
};

export default function HomeHero({
  restaurantName,
  heroImage,
  phone,
  phoneLink,
  isOpen,
  pickupEnabled,
  deliveryEnabled,
}: Props) {
  const tp = useTenantPublicPath();
  const src = resolveHeroImage(heroImage);
  const restaurantPhoto = src === "/images/Ellstorps-Krog.png";
  const canOrder = pickupEnabled || deliveryEnabled;

  const statusChip = (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-[#0f0f0f]/50 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide backdrop-blur-md lg:text-xs">
      <span
        className={`h-1.5 w-1.5 rounded-full lg:h-2 lg:w-2 ${
          isOpen
            ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
            : "bg-red-400"
        }`}
      />
      <span className="text-white">{isOpen ? "Öppet nu" : "Stängt"}</span>
    </div>
  );

  const ratingChip = (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/80 lg:text-xs">
      <Star size={11} fill="currentColor" className="text-[#b85c38]" />
      4,8
    </div>
  );

  const malmoChip = (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/80 lg:text-xs">
      Malmö
    </div>
  );

  return (
    <section className={`relative flex min-h-[68dvh] items-end overflow-hidden lg:min-h-[88dvh] ${restaurantPhoto ? styles.hero : ""}`}>
      <div className={`absolute inset-0 ${restaurantPhoto ? styles.photo : ""}`}>
        <Image
          src={src}
          alt={restaurantPhoto ? "Ellstorps Krog – fasad och uteservering i kvällsljus" : restaurantName}
          fill
          priority
          unoptimized={src.startsWith("http")}
          className={restaurantPhoto ? styles.image : "object-cover hero-image-motion"}
          sizes="100vw"
        />
      </div>

      {restaurantPhoto ? <div className={styles.overlay} aria-hidden /> : <>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/92 to-[#0f0f0f]/35" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f]/98 via-[#0f0f0f]/55 to-transparent lg:via-[#0f0f0f]/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_75%_35%,rgba(184,92,56,0.14),transparent)]" />
      <div className="brand-grain absolute inset-0 opacity-40" />
      </>}

      <div className={`relative z-10 mx-auto w-full max-w-6xl px-[var(--content-px)] pb-8 pt-[var(--header-height-mobile)] lg:pb-20 lg:pt-[calc(var(--header-height)+3rem)] ${restaurantPhoto ? styles.content : ""}`}>
        <div className="mb-5 hidden flex-wrap items-center gap-2 lg:mb-7 lg:flex lg:gap-3">
          {statusChip}
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/80 lg:text-xs">
            <Star size={11} fill="currentColor" className="text-[#b85c38]" />
            4,8 · Malmö
          </div>
        </div>

        <div className="flex gap-5 lg:gap-8">
          <div
            className="hidden w-px shrink-0 bg-gradient-to-b from-[#b85c38] via-[#b85c38]/40 to-transparent lg:block lg:min-h-[13rem]"
            aria-hidden
          />

          <div className="min-w-0 flex-1 text-center lg:max-w-[52rem] lg:text-left">
            {!restaurantPhoto && <BrandLogo
              size="home-hero"
              href={tp("/")}
              className="mx-auto lg:hidden"
              priority
            />}

            <p className="section-label mb-2 lg:mb-5">
              {restaurantPhoto ? "Ellstorps Krog" : restaurantName} · Malmö
            </p>

            <h1 className="text-display mx-auto max-w-[11ch] text-[2.35rem] leading-[1.06] text-white sm:text-5xl lg:mx-0 lg:max-w-[13ch] lg:text-[4.5rem]">
              Smakrik mat,
              <span className="mt-1 block text-white lg:mt-2">
                serverad med omsorg
              </span>
            </h1>

            <p className="text-body mx-auto mt-3 max-w-md text-[0.9375rem] leading-snug text-white/60 sm:mt-6 sm:text-base lg:mx-0 lg:mt-6 lg:max-w-xl lg:text-lg lg:leading-relaxed">
              Pizza, kebab och à la carte i hjärtat av Malmö. Beställ online
              eller besök oss för en kväll att minnas.
            </p>

            <div className="mx-auto mt-4 flex max-w-md flex-col gap-2.5 sm:mt-10 sm:flex-row sm:items-center lg:mx-0 lg:mt-6 lg:max-w-none lg:gap-3.5">
              {canOrder && (
                <Link
                  href={tp("/menu")}
                  className="btn-primary group flex w-full items-center justify-center gap-2 sm:w-auto"
                >
                  Beställ online
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-0.5"
                  />
                </Link>
              )}

              <Link
                href={tp("/menu")}
                className="btn-secondary flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                <UtensilsCrossed size={18} />
                Se meny
              </Link>
            </div>

            <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-2 lg:hidden">
              {statusChip}
              {ratingChip}
              {malmoChip}
            </div>

            <a
              href={phoneLink}
              className="mt-4 hidden items-center gap-2 text-sm text-white/50 transition hover:text-white lg:mt-6 lg:inline-flex"
            >
              <Phone size={16} className="text-[#b85c38]" />
              {phone}
            </a>

            <div className="mt-8 hidden max-w-2xl justify-between gap-8 border-t border-white/[0.08] pt-6 lg:flex">
              {[
                { value: "20+", label: "År i Malmö" },
                { value: "15–20 min", label: "Snabb avhämtning" },
                { value: "100%", label: "Färska råvaror" },
                { value: "10%", label: "Studentrabatt" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-serif text-2xl text-white sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
