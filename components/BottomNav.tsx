"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, ShoppingCart, MessageCircle, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const iconWrap = (path: string) =>
    `w-9 h-9 flex items-center justify-center rounded-xl transition ${
      pathname === path ? "bg-black text-white" : "text-gray-400"
    }`;

  const textClass = (path: string) =>
    `text-xs mt-1 transition ${
      pathname === path ? "text-black" : "text-gray-400"
    }`;

  return (
    <>
      {/* BAGGRUND OVERLAY */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-black z-40" />

      {/* SELVE MENUEN */}
      <div className="fixed bottom-3 left-0 right-0 z-50 flex justify-center">
        <nav className="bg-white rounded-2xl shadow-xl w-[95%] max-w-md border">
          <div className="flex justify-around items-center h-16">

            <Link href="/" className="flex flex-col items-center">
              <div className={iconWrap("/")}>
                <Home size={18} />
              </div>
              <span className={textClass("/")}>Hem</span>
            </Link>

            <Link href="/bord" className="flex flex-col items-center">
              <div className={iconWrap("/bord")}>
                <CalendarDays size={18} />
              </div>
              <span className={textClass("/bord")}>Reservation</span>
            </Link>

            <Link href="/kurv" className="flex flex-col items-center">
              <div className={iconWrap("/kurv")}>
                <ShoppingCart size={18} />
              </div>
              <span className={textClass("/kurv")}>Korg</span>
            </Link>

            <Link href="/kontakt" className="flex flex-col items-center">
              <div className={iconWrap("/kontakt")}>
                <MessageCircle size={18} />
              </div>
              <span className={textClass("/kontakt")}>Kontakt</span>
            </Link>

            <Link href="/konto" className="flex flex-col items-center">
              <div className={iconWrap("/konto")}>
                <User size={18} />
              </div>
              <span className={textClass("/konto")}>Konto</span>
            </Link>

          </div>
        </nav>
      </div>
    </>
  );
}
