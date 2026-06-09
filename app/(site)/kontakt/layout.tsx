import type { Metadata } from "next";
import { generateSiteMetadata } from "@/lib/seo/metadata";
import { getPublicSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicSettings();
  return generateSiteMetadata({
    title: "Kontakt",
    description: `Kontakta ${settings.restaurantName}. Telefon, adress och kontaktformulär.`,
    path: "/kontakt",
  });
}

export default function KontaktLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
