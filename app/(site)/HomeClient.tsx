"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronUp } from "lucide-react";
import Footer from "@/components/Footer";
import DeliveryPickup from "@/components/home/DeliveryPickup";
import FeaturedDishes from "@/components/home/FeaturedDishes";
import HomeHero from "@/components/home/HomeHero";
import HomeOpeningHours from "@/components/home/HomeOpeningHours";
import QuickActions from "@/components/home/QuickActions";
import Reviews from "@/components/home/Reviews";
import { useReservation } from "@/components/ReservationProvider";
import type { FeaturedDish } from "@/lib/home/featured";

export type HomeSettings = {
  restaurantName: string;
  heroImage: string;
  phone: string;
  phoneLink: string;
  isOpen: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  featuredDishes: FeaturedDish[];
};

export default function HomeClient({
  restaurantName,
  heroImage,
  phone,
  phoneLink,
  isOpen: initialIsOpen,
  pickupEnabled,
  deliveryEnabled,
  featuredDishes,
}: HomeSettings) {
  const { openReservation } = useReservation();
  const [showTop, setShowTop] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [isOpen, setIsOpen] = useState(initialIsOpen);

  useEffect(() => {
    setIsOpen(initialIsOpen);
  }, [initialIsOpen]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem("newsSeen");
    if (!seen) setShowNews(true);
  }, []);

  const closeNews = () => {
    setShowNews(false);
    localStorage.setItem("newsSeen", "true");
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="-mt-[var(--header-height-mobile)] min-h-screen bg-[#0f0f0f] text-white lg:-mt-[var(--header-height)] lg:pb-12">
      <HomeHero
        restaurantName={restaurantName}
        heroImage={heroImage}
        phone={phone}
        phoneLink={phoneLink}
        isOpen={isOpen}
        pickupEnabled={pickupEnabled}
        deliveryEnabled={deliveryEnabled}
      />

      <QuickActions
        pickupEnabled={pickupEnabled}
        deliveryEnabled={deliveryEnabled}
        phoneLink={phoneLink}
      />

      <FeaturedDishes dishes={featuredDishes} />

      <HomeOpeningHours isOpen={isOpen} />

      <DeliveryPickup
        pickupEnabled={pickupEnabled}
        deliveryEnabled={deliveryEnabled}
      />

      <Reviews />

      {/* CTA band — desktop primary */}
      <section className="hidden px-[var(--content-px)] pb-[var(--section-py)] lg:block">
        <div className="card-premium relative mx-auto max-w-6xl overflow-hidden rounded-[var(--radius-card)] px-8 py-12 text-center sm:px-16 sm:py-16">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#b85c38]/12 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#d4a574]/8 blur-3xl" />
          <p className="section-label relative mb-5">Bordsbokning</p>
          <h2 className="text-display relative text-2xl text-white sm:text-4xl">
            Vill du äta hos oss?
          </h2>
          <p className="text-body relative mx-auto mb-10 mt-4 max-w-md text-sm text-white/52 sm:text-base">
            Boka bord för en avslappnad middag i vår restaurang. Vi ser fram
            emot ditt besök.
          </p>
          <div className="relative flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={openReservation}
              className="btn-primary bg-white !from-white !to-white !text-[#0f0f0f] !shadow-none hover:!brightness-95"
            >
              <CalendarDays size={18} />
              Boka bord
            </button>
            <Link href="/kontakt" className="btn-secondary">
              Kontakta oss
            </Link>
          </div>
        </div>
      </section>

      {showNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-md">
          <div className="card-premium w-full max-w-sm space-y-5 rounded-3xl p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b85c38]/15 text-2xl">
              🍽️
            </div>
            <h3 className="font-serif text-2xl text-white">Välkommen!</h3>
            <p className="text-sm leading-relaxed text-white/55">
              Beställ online eller besök oss på {restaurantName}.
            </p>
            <button
              type="button"
              onClick={closeNews}
              className="btn-primary w-full"
            >
              Utforska menyn
            </button>
          </div>
        </div>
      )}

      {showTop && (
        <button
          type="button"
          onClick={scrollTop}
          aria-label="Till toppen"
          className="fixed bottom-[calc(var(--bottom-nav-height)+var(--bottom-nav-fab-overflow)+env(safe-area-inset-bottom,0px)+1rem)] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#b85c38] text-white shadow-lg shadow-black/40 transition hover:bg-[#a04f30] lg:bottom-6"
        >
          <ChevronUp size={22} />
        </button>
      )}

      <Footer />
    </div>
  );
}
