"use client";

import ConceptHomeRouter from "@/components/concepts/ConceptHomeRouter";
import type { FeaturedDish } from "@/lib/home/featured";

export type HomeSettings = {
  restaurantName: string;
  heroImage: string;
  phone: string;
  phoneLink: string;
  isOpen: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  featuredDishes: FeaturedDish[];
};

export default function HomeClient(props: HomeSettings) {
  return <ConceptHomeRouter {...props} />;
}
