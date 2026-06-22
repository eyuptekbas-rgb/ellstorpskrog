import { getTemplate, type TenantTemplateId } from "@/lib/tenant/templates";

/** Structural mobile layout — independent of color theme */
export type ConceptLayoutId =
  | "traditional"
  | "delivery-app"
  | "booking-first"
  | "card-modular"
  | "menu-first"
  | "luxury-editorial"
  | "scandinavian-imagery"
  | "gastro-pub"
  | "app-store-horizontal"
  | "fast-order";

export type ConceptLayoutMeta = {
  id: ConceptLayoutId;
  index: number;
  name: string;
  tagline: string;
  navStyle:
    | "fab-center"
    | "equal-tabs"
    | "booking-fab"
    | "pill-tabs"
    | "drawer-menu"
    | "editorial-minimal"
    | "image-bar"
    | "social-bar"
    | "horizontal-pills"
    | "conversion-bar";
};

export const CONCEPT_LAYOUTS: ConceptLayoutMeta[] = [
  {
    id: "traditional",
    index: 1,
    name: "Traditional Restaurant",
    tagline: "Bottom nav · large hero · classic sections",
    navStyle: "fab-center",
  },
  {
    id: "delivery-app",
    index: 2,
    name: "Delivery App",
    tagline: "Sticky categories · food-first · delivery CTAs",
    navStyle: "equal-tabs",
  },
  {
    id: "booking-first",
    index: 3,
    name: "Booking First",
    tagline: "Reservation hero · table booking focus",
    navStyle: "booking-fab",
  },
  {
    id: "card-modular",
    index: 4,
    name: "Card Modular",
    tagline: "Modular cards · grid homepage",
    navStyle: "pill-tabs",
  },
  {
    id: "menu-first",
    index: 5,
    name: "Menu First",
    tagline: "Full-screen nav · minimal landing",
    navStyle: "drawer-menu",
  },
  {
    id: "luxury-editorial",
    index: 6,
    name: "Premium Luxury",
    tagline: "Editorial typography · refined hierarchy",
    navStyle: "editorial-minimal",
  },
  {
    id: "scandinavian-imagery",
    index: 7,
    name: "Modern Scandinavian",
    tagline: "Large imagery · minimal copy",
    navStyle: "image-bar",
  },
  {
    id: "gastro-pub",
    index: 8,
    name: "Gastro Pub",
    tagline: "Social · events · community focus",
    navStyle: "social-bar",
  },
  {
    id: "app-store-horizontal",
    index: 9,
    name: "App Store",
    tagline: "Horizontal rails · featured rows",
    navStyle: "horizontal-pills",
  },
  {
    id: "fast-order",
    index: 10,
    name: "Fast Order",
    tagline: "Conversion-first · order CTAs everywhere",
    navStyle: "conversion-bar",
  },
];

const layoutMap = new Map(CONCEPT_LAYOUTS.map((l) => [l.id, l]));

/** One layout per visual template — 10 distinct mobile UX directions */
export const TEMPLATE_LAYOUT_MAP: Record<TenantTemplateId, ConceptLayoutId> = {
  "dark-copper-premium": "traditional",
  "modern-food-delivery": "delivery-app",
  "elegant-fine-dining": "booking-first",
  "premium-app-store": "card-modular",
  "minimal-black-white": "menu-first",
  "luxury-steakhouse": "luxury-editorial",
  "premium-scandinavian": "scandinavian-imagery",
  "rustic-gastro-pub": "gastro-pub",
  "italian-trattoria": "app-store-horizontal",
  "modern-nordic-bistro": "fast-order",
};

export function getConceptLayoutId(
  templateId: string | null | undefined
): ConceptLayoutId {
  const id = getTemplate(templateId).id;
  return TEMPLATE_LAYOUT_MAP[id] ?? "traditional";
}

export function getConceptLayoutMeta(
  layoutId: ConceptLayoutId
): ConceptLayoutMeta {
  return layoutMap.get(layoutId) ?? CONCEPT_LAYOUTS[0];
}

export function getConceptLayoutForTemplate(
  templateId: string | null | undefined
): ConceptLayoutMeta {
  return getConceptLayoutMeta(getConceptLayoutId(templateId));
}
