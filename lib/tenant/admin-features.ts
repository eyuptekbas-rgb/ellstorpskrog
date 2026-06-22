/** Admin panel modules that platform can enable/disable per tenant */

export const ADMIN_FEATURE_IDS = [
  "orders",
  "reservations",
  "customers",
  "staff",
  "economy",
  "products",
  "categories",
  "extras",
  "settings",
  "payments",
  "openingHours",
  "delivery",
  "notifications",
  "seo",
  "marketing",
  "system",
] as const;

export type AdminFeatureId = (typeof ADMIN_FEATURE_IDS)[number];

export type AdminFeatures = Record<AdminFeatureId, boolean>;

export const ADMIN_FEATURE_LABELS: Record<
  AdminFeatureId,
  { label: string; description: string; group: "overview" | "catalog" | "system" }
> = {
  orders: {
    label: "Beställningar",
    description: "Ta emot och hantera onlinebeställningar",
    group: "overview",
  },
  reservations: {
    label: "Reservationer",
    description: "Bordsbokningar och gästlistor",
    group: "overview",
  },
  customers: {
    label: "Kunder",
    description: "CRM, lojalitet och kundhistorik",
    group: "overview",
  },
  staff: {
    label: "Personal",
    description: "Anställda, roller och behörigheter",
    group: "system",
  },
  economy: {
    label: "Ekonomi",
    description: "Intäkter, fakturor och betalningsöversikt",
    group: "overview",
  },
  products: {
    label: "Produkter",
    description: "Menyartiklar och priser",
    group: "catalog",
  },
  categories: {
    label: "Kategorier",
    description: "Menystruktur och sortering",
    group: "catalog",
  },
  extras: {
    label: "Tillbehör",
    description: "Extra val och tillägg",
    group: "catalog",
  },
  settings: {
    label: "Inställningar",
    description: "Restauranginfo, logo och hero",
    group: "system",
  },
  payments: {
    label: "Betalningar",
    description: "Stripe och betalsätt",
    group: "system",
  },
  openingHours: {
    label: "Öppettider",
    description: "Veckoschema och stängda dagar",
    group: "system",
  },
  delivery: {
    label: "Leverans",
    description: "Leveranszoner och avgifter",
    group: "system",
  },
  notifications: {
    label: "E-post",
    description: "Order- och kundnotiser",
    group: "system",
  },
  seo: {
    label: "SEO",
    description: "Meta, sitemap och sökoptimering",
    group: "system",
  },
  marketing: {
    label: "Marknadsföring",
    description: "Analytics, pixels och spårning",
    group: "system",
  },
  system: {
    label: "System",
    description: "Driftstatus och produktionschecklista",
    group: "system",
  },
};

/** Route prefix → required feature (dashboard has no feature gate) */
export const ADMIN_ROUTE_FEATURES: Record<string, AdminFeatureId | null> = {
  "/admin": null,
  "/admin/orders": "orders",
  "/admin/order-flow": "orders",
  "/admin/analytics": "economy",
  "/admin/reports": "economy",
  "/admin/tables": "reservations",
  "/admin/shifts": "staff",
  "/admin/restaurant": "settings",
  "/admin/terminals": "settings",
  "/admin/audit": "settings",
  "/admin/monitoring": "system",
  "/admin/backup": "system",
  "/pos": "orders",
  "/kitchen": "orders",
  "/delivery": "orders",
  "/customer-display": "orders",
  "/admin/reservations": "reservations",
  "/admin/customers": "customers",
  "/admin/staff": "staff",
  "/admin/ekonomi": "economy",
  "/admin/products": "products",
  "/admin/categories": "categories",
  "/admin/menu": "products",
  "/admin/extras": "extras",
  "/admin/settings": "settings",
  "/admin/payments": "payments",
  "/admin/opening-hours": "openingHours",
  "/admin/delivery": "delivery",
  "/admin/notifications": "notifications",
  "/admin/seo": "seo",
  "/admin/marketing": "marketing",
  "/admin/system": "system",
};

export function defaultAdminFeatures(): AdminFeatures {
  return Object.fromEntries(
    ADMIN_FEATURE_IDS.map((id) => [id, true])
  ) as AdminFeatures;
}

export function resolveAdminFeatures(raw: unknown): AdminFeatures {
  const defaults = defaultAdminFeatures();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }

  const input = raw as Record<string, unknown>;
  const result = { ...defaults };

  for (const id of ADMIN_FEATURE_IDS) {
    if (typeof input[id] === "boolean") {
      result[id] = input[id];
    }
  }

  return result;
}

export function parseAdminFeaturesInput(
  raw: unknown
): AdminFeatures | null {
  if (raw === undefined) return null;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const input = raw as Record<string, unknown>;
  const result = defaultAdminFeatures();

  for (const id of ADMIN_FEATURE_IDS) {
    if (typeof input[id] === "boolean") {
      result[id] = input[id];
    }
  }

  return result;
}

export function getRequiredFeatureForPath(pathname: string): AdminFeatureId | null {
  const normalized =
    pathname.endsWith("/") && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  if (normalized in ADMIN_ROUTE_FEATURES) {
    return ADMIN_ROUTE_FEATURES[normalized];
  }

  const match = Object.entries(ADMIN_ROUTE_FEATURES)
    .filter(([route]) => route !== "/admin")
    .sort((a, b) => b[0].length - a[0].length)
    .find(([route]) => normalized.startsWith(`${route}/`));

  return match?.[1] ?? null;
}

export function isAdminPathAllowed(
  pathname: string,
  features: AdminFeatures,
  bypass = false
): boolean {
  if (bypass) return true;
  const required = getRequiredFeatureForPath(pathname);
  if (!required) return true;
  return features[required];
}
