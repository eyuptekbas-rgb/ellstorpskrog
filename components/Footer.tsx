import { Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer
      className="relative text-white border-t border-white/10 mt-16
      bg-[#111111]
      bg-gradient-to-b from-[#1a1a1a] via-[#121212] to-[#0a0a0a]"
    >
      {/* SOFT TEXTURE OVERLAY */}
      <div className="absolute inset-0 opacity-20 pointer-events-none
        bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-6 py-12
        grid grid-cols-1 gap-10 text-sm
        md:grid-cols-4">

        {/* ADDRESS */}
        <div className="flex items-start gap-3">
          <MapPin size={18} className="mt-1" />
          <div>
            <p className="font-semibold mb-1">Adresse</p>
            <p className="text-white/70">
              Sallerupsvägen 28<br />
              212 18 Malmö
            </p>
          </div>
        </div>

        {/* CONTACT */}
        <div className="flex flex-col gap-3">
          <p className="font-semibold">Kontakt</p>

          <a
            href="mailto:info@ellstorpskrog.se"
            className="flex items-center gap-2 text-white/70 hover:text-white"
          >
            <Mail size={16} />
            info@ellstorpskrog.se
          </a>

          <a
            href="tel:+4640184268"
            className="flex items-center gap-2 text-white/70 hover:text-white"
          >
            <Phone size={16} />
            040-184268
          </a>
        </div>

        {/* SOCIAL MEDIA */}
        <div>
          <p className="font-semibold mb-3">Sociale Medier</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white/80">
              <Facebook size={20} />
            </a>
            <a href="#" className="hover:text-white/80">
              <Instagram size={20} />
            </a>
          </div>
        </div>

        {/* PAYMENTS */}
        <div>
          <p className="font-semibold mb-3">Betalingsmetoder</p>
          <div className="flex gap-3 items-center opacity-80">
            <Image src="/payments/visa.png" alt="Visa" width={40} height={25} />
            <Image src="/payments/mastercard.png" alt="Mastercard" width={40} height={25} />
            <Image src="/payments/applepay.png" alt="Apple Pay" width={40} height={25} />
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
