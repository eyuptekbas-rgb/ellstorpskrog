"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Phone,
  ShoppingBag,
  Star,
  Truck,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import type { HomeSettings } from "@/app/(site)/HomeClient";
import Footer from "@/components/Footer";
import DeliveryPickup from "@/components/home/DeliveryPickup";
import FeaturedDishes from "@/components/home/FeaturedDishes";
import HomeHero from "@/components/home/HomeHero";
import HomeOpeningHours from "@/components/home/HomeOpeningHours";
import QuickActions from "@/components/home/QuickActions";
import Reviews from "@/components/home/Reviews";
import { useReservation } from "@/components/ReservationProvider";
import { useTenantPublicPath } from "@/components/tenant/TenantPublicPathProvider";
import { resolveHeroImage } from "@/lib/brand/images";
import type { ConceptLayoutId } from "@/lib/tenant/concept-layouts";
import { HomeScrollTopFab, HomeWelcomeModal } from "./HomeShared";

type Props = HomeSettings;

function Shell({
  children,
  restaurantName,
  className = "",
}: Props & { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`-mt-[var(--header-height-mobile)] min-h-screen bg-[var(--background)] text-[var(--foreground)] lg:-mt-[var(--header-height)] lg:pb-12 ${className}`}
    >
      {children}
      <HomeWelcomeModal restaurantName={restaurantName} />
      <HomeScrollTopFab />
      <Footer />
    </div>
  );
}

function BookingStrip({ compact = false }: { compact?: boolean }) {
  const { openReservation } = useReservation();
  const tp = useTenantPublicPath();

  return (
    <section
      className={`px-[var(--content-px)] ${compact ? "py-6" : "py-[var(--section-py-mobile)] lg:py-[var(--section-py)]"}`}
    >
      <div
        className={`card-premium mx-auto max-w-6xl overflow-hidden rounded-[var(--radius-card)] text-center ${
          compact ? "px-5 py-8" : "px-8 py-12 sm:px-16 sm:py-16"
        }`}
      >
        <p className="section-label mb-4">Bordsbokning</p>
        <h2 className="text-display text-2xl sm:text-4xl">
          Vill du äta hos oss?
        </h2>
        <p className="text-body mx-auto mb-8 mt-3 max-w-md text-sm sm:text-base">
          Boka bord för en avslappnad middag i vår restaurang.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={openReservation} className="btn-primary">
            <CalendarDays size={18} />
            Boka bord
          </button>
          <Link href={tp("/kontakt")} className="btn-secondary">
            Kontakta oss
          </Link>
        </div>
      </div>
    </section>
  );
}

function CompactHero(props: Props & { tall?: boolean; minimal?: boolean }) {
  const tp = useTenantPublicPath();
  const src = resolveHeroImage(props.heroImage);
  const canOrder = props.pickupEnabled || props.deliveryEnabled;

  return (
    <section
      className={`relative overflow-hidden ${props.tall ? "min-h-[52dvh]" : "min-h-[38dvh]"} flex items-end`}
    >
      <Image
        src={src}
        alt={props.restaurantName}
        fill
        priority
        unoptimized={src.startsWith("http")}
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/70 to-transparent" />
      <div className="relative z-10 w-full px-[var(--content-px)] pb-6 pt-[calc(var(--header-height-mobile)+1rem)]">
        {!props.minimal && (
          <p className="section-label mb-2">{props.restaurantName}</p>
        )}
        <h1
          className={`text-display leading-tight text-white ${props.minimal ? "text-3xl" : "text-[2rem]"}`}
        >
          {props.minimal ? props.restaurantName : "Beställ & njut"}
        </h1>
        {!props.minimal && (
          <p className="text-body mt-2 max-w-sm text-sm text-white/55">
            Snabb avhämtning och hemleverans i Malmö.
          </p>
        )}
        {canOrder && (
          <Link href={tp("/menu")} className="btn-primary btn-sm mt-4 inline-flex">
            <ShoppingBag size={16} />
            Beställ nu
          </Link>
        )}
      </div>
    </section>
  );
}

function OrderNowBar() {
  const tp = useTenantPublicPath();
  return (
    <div className="sticky top-[var(--header-height-mobile)] z-30 border-b border-white/[0.06] bg-[var(--background)]/95 px-[var(--content-px)] py-3 backdrop-blur-md lg:hidden">
      <Link href={tp("/menu")} className="btn-primary flex w-full justify-center py-3.5">
        <ShoppingBag size={18} />
        Beställ mat — öppna menyn
      </Link>
    </div>
  );
}

function ModularCards(props: Props) {
  const tp = useTenantPublicPath();
  const { openReservation } = useReservation();

  const cards = [
    {
      title: "Beställ",
      desc: "Pizza, kebab & mer",
      href: tp("/menu"),
      icon: UtensilsCrossed,
    },
    {
      title: "Boka bord",
      desc: "Reservera kvällen",
      action: openReservation,
      icon: CalendarDays,
    },
    {
      title: "Kontakt",
      desc: "Hitta hit & ring",
      href: tp("/kontakt"),
      icon: MapPin,
    },
    {
      title: "Öppettider",
      desc: props.isOpen ? "Öppet nu" : "Stängt",
      href: tp("/kontakt"),
      icon: Phone,
    },
  ];

  return (
    <section className="px-[var(--content-px)] py-6">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3">
        {cards.map((card) => {
          const inner = (
            <>
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-copper)]/15 text-[var(--brand-cream)]">
                <card.icon size={18} />
              </span>
              <p className="font-semibold">{card.title}</p>
              <p className="mt-1 text-xs opacity-50">{card.desc}</p>
            </>
          );
          const cls =
            "card-premium flex flex-col rounded-[var(--radius-card)] p-4 text-left active:scale-[0.98] transition-transform";
          if (card.href) {
            return (
              <Link key={card.title} href={card.href} className={cls}>
                {inner}
              </Link>
            );
          }
          return (
            <button
              key={card.title}
              type="button"
              onClick={card.action}
              className={cls}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BookingHero(props: Props) {
  const { openReservation } = useReservation();
  const tp = useTenantPublicPath();
  const src = resolveHeroImage(props.heroImage);

  return (
    <section className="relative min-h-[72dvh] overflow-hidden">
      <Image src={src} alt="" fill className="object-cover opacity-40" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/30 to-[var(--background)]" />
      <div className="relative flex min-h-[72dvh] flex-col justify-end px-[var(--content-px)] pb-10 pt-[var(--header-height-mobile)]">
        <p className="section-label mb-3">Bordsbokning · Malmö</p>
        <h1 className="text-display max-w-[14ch] text-[2.5rem] leading-[1.05]">
          Boka din kväll hos {props.restaurantName}
        </h1>
        <p className="text-body mt-4 max-w-md text-sm opacity-60">
          Reservera bord för middag med vänner, familj eller kollegor.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={openReservation} className="btn-primary py-4">
            <CalendarDays size={18} />
            Boka bord nu
          </button>
          <Link href={tp("/menu")} className="btn-secondary py-4">
            Se menyn
          </Link>
        </div>
      </div>
    </section>
  );
}

function EditorialHero(props: Props) {
  const tp = useTenantPublicPath();
  return (
    <section className="border-b border-white/[0.06] px-[var(--content-px)] pb-10 pt-[calc(var(--header-height-mobile)+2rem)] lg:pt-[calc(var(--header-height)+3rem)]">
      <p className="mb-6 text-[0.65rem] font-medium uppercase tracking-[0.35em] opacity-40">
        {props.restaurantName}
      </p>
      <h1 className="text-display max-w-[9ch] text-[3.25rem] leading-[0.95] tracking-tight lg:text-[5rem]">
        En kväll att minnas
      </h1>
      <p className="mt-8 max-w-xs text-sm leading-relaxed opacity-50 lg:text-base">
        Förfinad mat och personlig service i Malmö sedan 1989.
      </p>
      <div className="mt-10 flex flex-col gap-4 border-t border-white/[0.08] pt-8 sm:flex-row">
        <Link href={tp("/menu")} className="text-sm font-semibold uppercase tracking-[0.2em]">
          Meny →
        </Link>
        <Link href={tp("/kontakt")} className="text-sm font-semibold uppercase tracking-[0.2em] opacity-50">
          Kontakt →
        </Link>
      </div>
    </section>
  );
}

function ScandinavianHero(props: Props) {
  const src = resolveHeroImage(props.heroImage);
  const tp = useTenantPublicPath();
  return (
    <section className="relative aspect-[3/4] max-h-[85dvh] w-full overflow-hidden lg:aspect-auto lg:min-h-[90dvh]">
      <Image src={src} alt={props.restaurantName} fill className="object-cover" priority sizes="100vw" />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute bottom-0 left-0 right-0 p-[var(--content-px)] pb-12">
        <h1 className="text-display text-4xl text-white">{props.restaurantName}</h1>
        <Link href={tp("/menu")} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/90">
          Meny <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

function GastroSocialStrip() {
  return (
    <section className="border-y border-white/[0.06] bg-[var(--brand-elevated)] px-[var(--content-px)] py-8">
      <p className="section-label mb-4">Hos oss</p>
      <div className="space-y-4">
        {[
          { title: "Quizkvällar", sub: "Varje torsdag 19:00" },
          { title: "Livemusik", sub: "Utvalda fredagar" },
          { title: "After work", sub: "Tis–tor 16–18" },
        ].map((e) => (
          <div
            key={e.title}
            className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
          >
            <div>
              <p className="font-semibold">{e.title}</p>
              <p className="text-xs opacity-45">{e.sub}</p>
            </div>
            <Users size={18} className="opacity-30" />
          </div>
        ))}
      </div>
    </section>
  );
}

function HorizontalFeaturedRail(props: Props) {
  const tp = useTenantPublicPath();
  if (props.featuredDishes.length === 0) return null;

  return (
    <section className="py-6">
      <div className="mb-4 flex items-center justify-between px-[var(--content-px)]">
        <h2 className="text-display text-xl">Populärt</h2>
        <Link href={tp("/menu")} className="text-xs font-semibold text-[var(--brand-copper)]">
          Visa alla
        </Link>
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--content-px)] pb-2 scrollbar-hide">
        {props.featuredDishes.map((dish) => (
          <Link
            key={dish.id}
            href={tp("/menu")}
            className="card-premium w-[72vw] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)]"
          >
            <div className="relative aspect-[4/3] bg-[var(--brand-elevated)]">
              {dish.image && (
                <Image src={dish.image} alt={dish.name} fill className="object-cover" sizes="280px" />
              )}
            </div>
            <div className="p-4">
              <p className="font-semibold">{dish.name}</p>
              <p className="mt-1 text-sm text-[var(--brand-cream)]">{dish.price} kr</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MinimalLanding(props: Props) {
  const tp = useTenantPublicPath();
  const { openReservation } = useReservation();

  return (
    <section className="flex min-h-[calc(100dvh-var(--header-height-mobile)-var(--bottom-nav-height))] flex-col justify-center px-[var(--content-px)] py-12 text-center">
      <p className="section-label mb-4">{props.restaurantName}</p>
      <h1 className="text-display text-3xl">Välkommen</h1>
      <p className="text-body mx-auto mt-3 max-w-xs text-sm opacity-50">
        Öppna menyn för att beställa eller boka bord.
      </p>
      <div className="mx-auto mt-10 flex w-full max-w-xs flex-col gap-3">
        <Link href={tp("/menu")} className="btn-primary py-4">
          <UtensilsCrossed size={18} />
          Öppna menyn
        </Link>
        <button type="button" onClick={openReservation} className="btn-secondary py-4">
          Boka bord
        </button>
      </div>
    </section>
  );
}

function FastOrderHero(props: Props) {
  const tp = useTenantPublicPath();
  return (
    <section className="px-[var(--content-px)] pb-4 pt-[calc(var(--header-height-mobile)+0.75rem)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-display text-2xl">Hungry?</h1>
          <p className="text-xs opacity-45">
            {props.isOpen ? "Öppet · 20 min avhämtning" : "Stängt just nu"}
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[var(--brand-copper)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--brand-cream)]">
          <Star size={12} fill="currentColor" /> 4,8
        </span>
      </div>
      <Link href={tp("/menu")} className="btn-primary mt-4 flex w-full justify-center py-4 text-base">
        <ShoppingBag size={20} />
        Starta beställning
      </Link>
      {(props.deliveryEnabled || props.pickupEnabled) && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {props.deliveryEnabled && (
            <Link href={tp("/menu")} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-xs font-medium">
              <Truck size={16} /> Leverans
            </Link>
          )}
          {props.pickupEnabled && (
            <Link href={tp("/menu")} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-xs font-medium">
              <ShoppingBag size={16} /> Hämta
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export function TraditionalHome(props: Props) {
  return (
    <Shell {...props}>
      <HomeHero {...props} />
      <QuickActions
        pickupEnabled={props.pickupEnabled}
        deliveryEnabled={props.deliveryEnabled}
        phoneLink={props.phoneLink}
      />
      <FeaturedDishes dishes={props.featuredDishes} />
      <HomeOpeningHours isOpen={props.isOpen} />
      <DeliveryPickup pickupEnabled={props.pickupEnabled} deliveryEnabled={props.deliveryEnabled} />
      <Reviews reviews={props.googleReviews} googleUrl={props.googleReviewsUrl ?? "https://www.google.com/maps/search/?api=1&query=Ellstorps+Kvarterskrog+Sallerupsv%C3%A4gen+28D+Malm%C3%B6"} />
      <section className="hidden px-[var(--content-px)] pb-[var(--section-py)] lg:block">
        <BookingStrip />
      </section>
    </Shell>
  );
}

export function DeliveryAppHome(props: Props) {
  return (
    <Shell {...props} className="concept-home--delivery">
      <CompactHero {...props} />
      <OrderNowBar />
      <FeaturedDishes dishes={props.featuredDishes} />
      <QuickActions
        pickupEnabled={props.pickupEnabled}
        deliveryEnabled={props.deliveryEnabled}
        phoneLink={props.phoneLink}
      />
      <HomeOpeningHours isOpen={props.isOpen} />
      <DeliveryPickup pickupEnabled={props.pickupEnabled} deliveryEnabled={props.deliveryEnabled} />
      <Reviews reviews={props.googleReviews} googleUrl={props.googleReviewsUrl ?? "https://www.google.com/maps/search/?api=1&query=Ellstorps+Kvarterskrog+Sallerupsv%C3%A4gen+28D+Malm%C3%B6"} />
    </Shell>
  );
}

export function BookingFirstHome(props: Props) {
  return (
    <Shell {...props}>
      <BookingHero {...props} />
      <HomeOpeningHours isOpen={props.isOpen} />
      <BookingStrip compact />
      <FeaturedDishes dishes={props.featuredDishes} />
      <Reviews reviews={props.googleReviews} googleUrl={props.googleReviewsUrl ?? "https://www.google.com/maps/search/?api=1&query=Ellstorps+Kvarterskrog+Sallerupsv%C3%A4gen+28D+Malm%C3%B6"} />
      <DeliveryPickup pickupEnabled={props.pickupEnabled} deliveryEnabled={props.deliveryEnabled} />
    </Shell>
  );
}

export function CardModularHome(props: Props) {
  return (
    <Shell {...props}>
      <CompactHero {...props} tall />
      <ModularCards {...props} />
      <FeaturedDishes dishes={props.featuredDishes} />
      <HomeOpeningHours isOpen={props.isOpen} />
      <Reviews reviews={props.googleReviews} googleUrl={props.googleReviewsUrl ?? "https://www.google.com/maps/search/?api=1&query=Ellstorps+Kvarterskrog+Sallerupsv%C3%A4gen+28D+Malm%C3%B6"} />
    </Shell>
  );
}

export function MenuFirstHome(props: Props) {
  return (
    <Shell {...props}>
      <MinimalLanding {...props} />
      <FeaturedDishes dishes={props.featuredDishes} />
      <HomeOpeningHours isOpen={props.isOpen} />
    </Shell>
  );
}

export function LuxuryEditorialHome(props: Props) {
  return (
    <Shell {...props}>
      <EditorialHero {...props} />
      <FeaturedDishes dishes={props.featuredDishes} />
      <BookingStrip compact />
      <Reviews reviews={props.googleReviews} googleUrl={props.googleReviewsUrl ?? "https://www.google.com/maps/search/?api=1&query=Ellstorps+Kvarterskrog+Sallerupsv%C3%A4gen+28D+Malm%C3%B6"} />
      <HomeOpeningHours isOpen={props.isOpen} />
    </Shell>
  );
}

export function ScandinavianImageryHome(props: Props) {
  return (
    <Shell {...props}>
      <ScandinavianHero {...props} />
      <FeaturedDishes dishes={props.featuredDishes} />
      <HomeOpeningHours isOpen={props.isOpen} />
      <Reviews reviews={props.googleReviews} googleUrl={props.googleReviewsUrl ?? "https://www.google.com/maps/search/?api=1&query=Ellstorps+Kvarterskrog+Sallerupsv%C3%A4gen+28D+Malm%C3%B6"} />
    </Shell>
  );
}

export function GastroPubHome(props: Props) {
  return (
    <Shell {...props}>
      <CompactHero {...props} minimal />
      <GastroSocialStrip />
      <FeaturedDishes dishes={props.featuredDishes} />
      <QuickActions
        pickupEnabled={props.pickupEnabled}
        deliveryEnabled={props.deliveryEnabled}
        phoneLink={props.phoneLink}
      />
      <Reviews reviews={props.googleReviews} googleUrl={props.googleReviewsUrl ?? "https://www.google.com/maps/search/?api=1&query=Ellstorps+Kvarterskrog+Sallerupsv%C3%A4gen+28D+Malm%C3%B6"} />
      <HomeOpeningHours isOpen={props.isOpen} />
    </Shell>
  );
}

export function AppStoreHorizontalHome(props: Props) {
  return (
    <Shell {...props}>
      <section className="px-[var(--content-px)] pb-2 pt-[calc(var(--header-height-mobile)+1rem)]">
        <p className="section-label mb-2">Upptäck</p>
        <h1 className="text-display text-2xl">{props.restaurantName}</h1>
      </section>
      <HorizontalFeaturedRail {...props} />
      <section className="px-[var(--content-px)] py-4">
        <p className="section-label mb-3">Snabbval</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {["Beställ", "Boka", "Kontakt", "Meny"].map((label) => (
            <span
              key={label}
              className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-xs font-medium"
            >
              {label}
            </span>
          ))}
        </div>
      </section>
      <FeaturedDishes dishes={props.featuredDishes} />
      <Reviews reviews={props.googleReviews} googleUrl={props.googleReviewsUrl ?? "https://www.google.com/maps/search/?api=1&query=Ellstorps+Kvarterskrog+Sallerupsv%C3%A4gen+28D+Malm%C3%B6"} />
      <HomeOpeningHours isOpen={props.isOpen} />
    </Shell>
  );
}

export function FastOrderHome(props: Props) {
  return (
    <Shell {...props}>
      <FastOrderHero {...props} />
      <HorizontalFeaturedRail {...props} />
      <FeaturedDishes dishes={props.featuredDishes} />
      <HomeOpeningHours isOpen={props.isOpen} />
    </Shell>
  );
}

const HOME_BY_LAYOUT: Record<
  ConceptLayoutId,
  (props: Props) => React.ReactElement
> = {
  traditional: TraditionalHome,
  "delivery-app": DeliveryAppHome,
  "booking-first": BookingFirstHome,
  "card-modular": CardModularHome,
  "menu-first": MenuFirstHome,
  "luxury-editorial": LuxuryEditorialHome,
  "scandinavian-imagery": ScandinavianImageryHome,
  "gastro-pub": GastroPubHome,
  "app-store-horizontal": AppStoreHorizontalHome,
  "fast-order": FastOrderHome,
};

export function renderConceptHome(
  layoutId: ConceptLayoutId,
  props: Props
): React.ReactElement {
  const Layout = HOME_BY_LAYOUT[layoutId] ?? TraditionalHome;
  return <Layout {...props} />;
}
