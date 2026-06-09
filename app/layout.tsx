import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Playfair_Display, Montserrat } from "next/font/google";
import AppleSplashLinks from "@/components/pwa/AppleSplashLinks";
import AuthSessionProvider from "@/components/providers/SessionProvider";
import PwaInstallProvider from "@/components/pwa/PwaInstallProvider";
import { PWA } from "@/lib/pwa/config";

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
  applicationName: PWA.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: PWA.shortName,
  },
  formatDetection: {
    telephone: true,
    email: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: PWA.themeColor },
    { media: "(prefers-color-scheme: dark)", color: PWA.themeColor },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <AppleSplashLinks />
      </head>
      <body
        className={`${playfair.variable} ${montserrat.variable} bg-black text-white antialiased`}
      >
        <AuthSessionProvider>
          <PwaInstallProvider>{children}</PwaInstallProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
