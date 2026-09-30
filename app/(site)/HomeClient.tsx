"use client";

import ConceptHomeRouter from "@/components/concepts/ConceptHomeRouter";
import type { FeaturedDish } from "@/lib/home/featured";
import type { GoogleReview } from "@/lib/home/google-review-data";

export type HomeSettings = {
  restaurantName: string;
  heroImage: string;
  phone: string;
  phoneLink: string;
  isOpen: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  featuredDishes: FeaturedDish[];
  googleReviews?: GoogleReview[];
  googleReviewsUrl?: string;
};

export default function HomeClient(props: HomeSettings) {
  return <ConceptHomeRouter {...props} />;
}
