"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, MapPin, ShoppingCart } from "lucide-react";
import { openingHours } from "@/lib/openingHours";

export default function Header() {

  function getStatus() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    const hour = now.getHours();
    const minute = now.getMinutes();

    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ] as const;

    const today = openingHours[days[day]];
    if (!today) return "Stängt";

    const [openH, openM] = today.open.split(":").map(Number);
    const [closeH, closeM] = today.close.split(":").map(Number);

    const nowMinutes = hour * 60 + minute;
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) {
      return `Öppet – stänger ${today.close}`;
    }

    return `Stängt – öppnar ${today.open}`;
  }

  const statusText = getStatus();
  const isOpen = statusText.startsWith("Öppet");

  return (
    <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">

          {/* LOGO */}
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Ellstorps Krog"
              width={140}
              height={50}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          {/* STATUS */}
          <div className="flex items-center gap-1 text-[11px] text-white/90">
            <span
              className={`w-2 h-2 rounded-full ${
                isOpen ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            <span>{statusText}</span>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2 text-white">

          {/* MAPS */}
          <a
            href="https://maps.google.com"
            target="_blank"
            className="p-2 hover:bg-white/10 rounded-full transition"
          >
            <MapPin size={22} />
          </a>

          {/* PHONE */}
          <a
            href="tel:+46123456789"
            className="p-2 hover:bg-white/10 rounded-full transition"
          >
            <Phone size={22} />
          </a>

          {/* CART */}
          <button className="relative p-2 hover:bg-white/10 rounded-full transition">
            <ShoppingCart size={22} />
            <span className="absolute -top-1 -right-1 text-[10px] bg-white text-black rounded-full px-1.5">
              1
            </span>
          </button>

        </div>
      </div>
    </header>
  );
}
