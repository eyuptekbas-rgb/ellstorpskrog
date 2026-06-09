import type { Metadata } from "next";
import { generateSiteMetadata } from "@/lib/seo/metadata";
import { getPublicSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicSettings();
  return generateSiteMetadata({
    title: "Boka bord",
    description: `Boka bord på ${settings.restaurantName}. Reservera enkelt online.`,
    path: "/reservation",
  });
}

export default function ReservationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
