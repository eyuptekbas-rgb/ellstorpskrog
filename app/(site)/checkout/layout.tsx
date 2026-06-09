import type { Metadata } from "next";
import { generateSiteMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return generateSiteMetadata({
    title: "Kassa",
    description: "Slutför din beställning.",
    path: "/checkout",
    noIndex: true,
  });
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
