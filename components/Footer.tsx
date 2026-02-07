import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  CreditCard,
  Map
} from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer
      className="relative text-white border-t border-white/10 mt-16
      bg-[#111111]
      bg-gradient-to-b from-[#1a1a1a] via-[#121212] to-[#0a0a0a]"
    >
      {/* SOFT TEXTURE OVERLAY */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none
        bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_60%)]"
      />

      <div
        className="relative max-w-7xl mx-auto px-6 py-12
        grid grid-cols-1 gap-8 text-sm
        md:grid-cols-4"
      >

        {/* ADDRESS */}
        <div className="flex items-start gap-3 border-b border-white/10 pb-5 md:border-0">
          <MapPin size={18} className="mt-1 opacity-80" />
          <div>
            <p className="font-semibold mb-1">Adresse</p>
            <p className="text-white/70 leading-relaxed">
              Sallerupsvägen 28<br />
              212 18 Malmö
            </p>

            <div className="flex gap-4 mt-3 text-white/70 text-xs">
              <a
                href="https://maps.google.com/?q=Sallerupsvägen+28+Malmö"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-white"
              >
                <Map size={14} />
                Google Maps
              </a>

              <a
                href="https://maps.apple.com/?q=Sallerupsvägen+28+Malmö"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-white"
              >
                <Map size={14} />
                Apple Maps
              </a>
            </div>
          </div>
        </div>

        {/* CONTACT */}
        <div className="flex items-start gap-3 border-b border-white/10 pb-5 md:border-0">
          <Phone size={18} className="mt-1 opacity-80" />
          <div>
            <p className="font-semibold mb-1">Kontakt</p>

            <a
              href="mailto:info@ellstorpskrog.se"
              className="block text-white/70 hover:text-white"
            >
              info@ellstorpskrog.se
            </a>

            <a
              href="tel:+4640184268"
              className="block text-white/70 hover:text-white"
            >
              040-184268
            </a>
          </div>
        </div>

        {/* SOCIAL */}
        <div className="flex items-start gap-3 border-b border-white/10 pb-5 md:border-0">
          <Instagram size={18} className="mt-1 opacity-80" />
          <div>
            <p className="font-semibold mb-2">Sociale Medier</p>
            <div className="flex gap-4 text-white/80">
              <a href="#" className="hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-white">
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* PAYMENTS */}
        <div className="flex items-start gap-3">
          <CreditCard size={18} className="mt-1 opacity-80" />
          <div>
            <p className="font-semibold mb-2">Betalingsmetoder</p>

            <div className="flex gap-4 items-center flex-wrap mt-2">

              <div className="bg-white rounded-md px-3 py-2 shadow-md">
                <Image src="/payments/visa.png" alt="Visa" width={34} height={22} />
              </div>

              <div className="bg-white rounded-md px-3 py-2 shadow-md">
                <Image src="/payments/mastercard.png" alt="Mastercard" width={34} height={22} />
              </div>

              <div className="bg-white rounded-md px-3 py-2 shadow-md">
                <Image src="/payments/applepay.png" alt="Apple Pay" width={34} height={22} />
              </div>

              <div className="bg-white rounded-md px-3 py-2 shadow-md">
                <Image src="/payments/swish.png" alt="Swish" width={54} height={36} />
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* BOTTOM LINE */}
      <div className="relative text-center text-xs text-white/40 py-6 border-t border-white/10">
        © {new Date().getFullYear()} Ellstorps Krog – Alle rettigheder forbeholdes
      </div>
    </footer>
  );
}
