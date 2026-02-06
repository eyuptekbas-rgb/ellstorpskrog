"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, MapPin, ShoppingCart } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-sm bg-black/85 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-3">

          {/* LOGO */}
          <Link href="/">
            <Image
              src="/logo.png"   // læg logo i public/logo.png
              alt="Ellstorps Krog"
              width={140 }
              height={50}
              className="h-15 w-auto object-contain"
              priority
            />
          </Link>

          {/* STATUS */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-white/90">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Öppet – stänger 22:30</span>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2 text-white">

          {/* LANGUAGE */}
          {/*
          <div className="flex items-center gap-1">
            <button>
              <Image src="/flags/se.png" alt="Swedish" width={60} height={40} />
            </button>
            <button>
              <Image src="/flags/gb.png" alt="English" width={100} height={22} />
            </button>
          </div>
          */}

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
