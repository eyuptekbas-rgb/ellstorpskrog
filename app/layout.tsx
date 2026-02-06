import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import Header from "@/components/Header"; // 👈 NY

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "OnlineFood",
  description: "Restaurant Online Beställning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className={`${inter.className} bg-black text-white`}>
        {/* HEADER */}
        <Header />

        {/* MAIN CONTENT */}
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
