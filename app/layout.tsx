import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"], // 👈 DETTE ER NØGLEN
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
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
