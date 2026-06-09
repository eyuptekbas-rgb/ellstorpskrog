import HomeClient from "@/app/(site)/HomeClient";
import JsonLd from "@/components/seo/JsonLd";
import { getFeaturedDishes } from "@/lib/home/featured";
import { getPublicMenu } from "@/lib/menu";
import { buildHomeSchemaGraph } from "@/lib/seo/schema";
import { getPublicSettings, phoneHref } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { settings, openingHours, isOpen } = await getPublicSettings();
  const menu = await getPublicMenu();
  const featuredDishes = getFeaturedDishes(menu, 6);
  const schema = buildHomeSchemaGraph(settings, openingHours);

  return (
    <>
      <JsonLd data={schema} />
      <HomeClient
        restaurantName={settings.restaurantName}
        heroImage={settings.heroImage ?? "/hero.jpg"}
        phone={settings.phone}
        phoneLink={phoneHref(settings.phone)}
        isOpen={isOpen}
        pickupEnabled={settings.pickupEnabled}
        deliveryEnabled={settings.deliveryEnabled}
        featuredDishes={featuredDishes}
      />
    </>
  );
}
