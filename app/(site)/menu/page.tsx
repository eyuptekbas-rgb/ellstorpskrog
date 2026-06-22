import type { Metadata } from "next";
import { getPublicMenu } from "@/lib/menu";
import MenuClient from "@/app/(site)/menu/MenuClient";
import JsonLd from "@/components/seo/JsonLd";
import { generateSiteMetadata } from "@/lib/seo/metadata";
import { buildMenuPageSchemaGraph } from "@/lib/seo/schema";
import { getPublicSettings } from "@/lib/settings";
import { auth } from "@/auth";
import { isCustomerRole } from "@/lib/auth/roles";
import {
  getPopularProductIds,
  getRecentlyOrderedProductIds,
} from "@/lib/menu/discovery";

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
  const [{ settings, openingHours }, categories, session] = await Promise.all([
    getPublicSettings(),
    getPublicMenu(),
    auth(),
  ]);

  const isLoggedInCustomer = Boolean(
    session?.user?.id && isCustomerRole(session.user.role)
  );

  // Discovery data (Menu V3). Popular is public; recently-ordered is gated to
  // signed-in customers — when not logged in we never fetch or render it.
  const [popularProductIds, recentProductIds] = await Promise.all([
    getPopularProductIds(),
    isLoggedInCustomer && session?.user?.id
      ? getRecentlyOrderedProductIds(session.user.id, session.user.email)
      : Promise.resolve<string[]>([]),
  ]);

  const schema = buildMenuPageSchemaGraph(settings, openingHours, categories);

  return (
    <>
      <JsonLd data={schema} />
      <MenuClient
        categories={categories}
        popularProductIds={popularProductIds}
        recentProductIds={isLoggedInCustomer ? recentProductIds : null}
      />
    </>
  );
}
