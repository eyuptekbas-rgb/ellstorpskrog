import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";

export const KITCHEN_SCREENS = [
  {
    id: "all",
    label: "Alla stationer",
    keywords: [] as string[],
  },
  {
    id: "pizza",
    label: "Pizza",
    keywords: ["pizza", "calzone", "focaccia"],
  },
  {
    id: "grill",
    label: "Grill",
    keywords: ["grill", "burger", "kebab", "steak", "bbq", "kyckling"],
  },
  {
    id: "pasta",
    label: "Pasta",
    keywords: ["pasta", "spaghetti", "lasagne", "ravioli", "penne"],
  },
  {
    id: "bar",
    label: "Bar",
    keywords: ["drink", "öl", "vin", "cocktail", "sprit", "cider", "latte", "kaffe"],
  },
  {
    id: "dessert",
    label: "Dessert",
    keywords: ["dessert", "glass", "tårta", "kaka", "paj", "choklad"],
  },
] as const;

export type KitchenScreenId = (typeof KITCHEN_SCREENS)[number]["id"];

export function resolveKitchenScreen(id: string | null | undefined) {
  return KITCHEN_SCREENS.find((screen) => screen.id === id) ?? KITCHEN_SCREENS[0];
}

function itemMatchesScreen(productName: string, keywords: readonly string[]) {
  if (keywords.length === 0) return true;
  const haystack = productName.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

export function filterOrdersForKitchenScreen(
  orders: AdminOrderListItem[],
  screenId: KitchenScreenId
): AdminOrderListItem[] {
  const screen = resolveKitchenScreen(screenId);
  if (screen.id === "all") return orders;

  return orders
    .map((order) => {
      const items = order.items.filter((item) =>
        itemMatchesScreen(item.productName, screen.keywords)
      );
      if (items.length === 0) return null;
      return { ...order, items };
    })
    .filter((order): order is AdminOrderListItem => order !== null);
}
