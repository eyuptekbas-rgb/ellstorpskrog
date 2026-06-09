import type { Metadata } from "next";
import { getPublicMenu } from "@/lib/menu";
import MenuClient from "@/app/(site)/menu/MenuClient";
import JsonLd from "@/components/seo/JsonLd";
import { generateSiteMetadata } from "@/lib/seo/metadata";
import { buildMenuPageSchemaGraph } from "@/lib/seo/schema";
import { getPublicSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicSettings();
  return generateSiteMetadata({
    title: "Meny",
    description:
      settings.metaDescription?.trim() ||
      `Se menyn hos ${settings.restaurantName} — pizza, kebab, burgare och mer. Beställ online.`,
    path: "/menu",
  });
}

export default async function MenuPage() {
  const [{ settings, openingHours }, categories] = await Promise.all([
    getPublicSettings(),
    getPublicMenu(),
  ]);

  const schema = buildMenuPageSchemaGraph(settings, openingHours, categories);

  return (
    <>
      <JsonLd data={schema} />
      <MenuClient categories={categories} />
    </>
  );
}
