import "./globals.css";
import { Playfair_Display, Montserrat } from "next/font/google";
import type { Metadata } from "next";
import Header from "@/components/Header";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-playfair",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Ellstorps Krog",
  description: "Restaurant Online Beställning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body
        className={`${playfair.variable} ${montserrat.variable} bg-black text-white`}
      >
        {/* HEADER */}
        <Header />

        {/* MAIN CONTENT */}
        <main className="pt-16 font-[var(--font-montserrat)]">
          {children}
        </main>
      </body>
    </html>
  );
}
