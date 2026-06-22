export type CartItemOption = {
  id: string;
  name: string;
  priceModifier: number;
};

export type CartItem = {
  lineKey: string;
  id: string;
  name: string;
  basePrice: number;
  price: number;
  quantity: number;
  image?: string | null;
  categorySlug?: string;
  categorySortOrder?: number;
  productSortOrder?: number;
  menuNumber?: number;
  selectedOptions: CartItemOption[];
  note?: string;
};

const CART_KEY = "ellstorps-cart";
const ORDER_NOTE_KEY = "ellstorps-order-note";

export function getCartLineUnitPrice(
  basePrice: number,
  options: CartItemOption[]
): number {
  return basePrice + options.reduce((sum, o) => sum + o.priceModifier, 0);
}

export function buildCartLineKey(
  productId: string,
  optionIds: string[],
  note: string
): string {
  const sorted = [...optionIds].sort().join(",");
  const trimmedNote = note.trim();
  return `${productId}:${sorted}:${trimmedNote}`;
}

export function formatOrderItemName(item: CartItem): string {
  let name = item.name;
  if (item.selectedOptions.length > 0) {
    name += ` (${item.selectedOptions.map((o) => o.name).join(", ")})`;
  }
  const note = item.note?.trim();
  if (note) {
    name += ` — ${note}`;
  }
  return name;
}

export function parseOrderItemDisplay(productName: string): {
  name: string;
  options: string[];
  note: string | null;
} {
  let rest = productName;
  let note: string | null = null;
  const noteSep = " — ";
  const noteIdx = rest.lastIndexOf(noteSep);
  if (noteIdx !== -1) {
    note = rest.slice(noteIdx + noteSep.length).trim() || null;
    rest = rest.slice(0, noteIdx);
  }

  let name = rest;
  let options: string[] = [];
  if (rest.endsWith(")")) {
    const openIdx = rest.lastIndexOf(" (");
    if (openIdx !== -1) {
      name = rest.slice(0, openIdx);
      const optionsStr = rest.slice(openIdx + 2, -1);
      options = optionsStr.split(", ").filter(Boolean);
    }
  }

  return { name, options, note };
}

function normalizeCartItem(raw: Partial<CartItem> & { id: string }): CartItem {
  const selectedOptions = raw.selectedOptions ?? [];
  const basePrice = raw.basePrice ?? raw.price ?? 0;
  const note = raw.note ?? "";
  const optionIds = selectedOptions.map((o) => o.id);
  const price =
    raw.price ??
    getCartLineUnitPrice(basePrice, selectedOptions);

  return {
    lineKey:
      raw.lineKey ??
      buildCartLineKey(raw.id, optionIds, note),
    id: raw.id,
    name: raw.name ?? "",
    basePrice,
    price,
    quantity: raw.quantity ?? 1,
    image: raw.image,
    categorySlug: raw.categorySlug,
    categorySortOrder: raw.categorySortOrder,
    productSortOrder: raw.productSortOrder,
    menuNumber: raw.menuNumber,
    selectedOptions,
    note: note || undefined,
  };
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<CartItem> & { id: string }>;
    return parsed.map(normalizeCartItem);
  } catch {
    return [];
  }
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

export function saveOrderNote(note: string) {
  localStorage.setItem(ORDER_NOTE_KEY, note);
}

export function loadOrderNote(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ORDER_NOTE_KEY) ?? "";
}

export function clearOrderNote() {
  localStorage.removeItem(ORDER_NOTE_KEY);
}

export type AddToCartPayload = {
  productId: string;
  name: string;
  basePrice: number;
  image?: string | null;
  categorySlug?: string;
  categorySortOrder?: number;
  productSortOrder?: number;
  menuNumber?: number;
  quantity: number;
  selectedOptions: CartItemOption[];
  note?: string;
};

/** Sort cart lines by printed menu category order, then product order. */
export function sortCartByMenuOrder(cart: CartItem[]): CartItem[] {
  return [...cart].sort((a, b) => {
    const catA = a.categorySortOrder ?? 999;
    const catB = b.categorySortOrder ?? 999;
    if (catA !== catB) return catA - catB;
    const prodA = a.productSortOrder ?? 999;
    const prodB = b.productSortOrder ?? 999;
    if (prodA !== prodB) return prodA - prodB;
    return a.name.localeCompare(b.name, "sv");
  });
}

export function addOrMergeCartItem(
  cart: CartItem[],
  payload: AddToCartPayload
): CartItem[] {
  const note = payload.note?.trim() ?? "";
  const lineKey = buildCartLineKey(
    payload.productId,
    payload.selectedOptions.map((o) => o.id),
    note
  );
  const unitPrice = getCartLineUnitPrice(
    payload.basePrice,
    payload.selectedOptions
  );

  const existing = cart.find((item) => item.lineKey === lineKey);
  if (existing) {
    return cart.map((item) =>
      item.lineKey === lineKey
        ? { ...item, quantity: item.quantity + payload.quantity }
        : item
    );
  }

  return [
    ...cart,
    {
      lineKey,
      id: payload.productId,
      name: payload.name,
      basePrice: payload.basePrice,
      price: unitPrice,
      quantity: payload.quantity,
      image: payload.image,
      categorySlug: payload.categorySlug,
      categorySortOrder: payload.categorySortOrder,
      productSortOrder: payload.productSortOrder,
      menuNumber: payload.menuNumber,
      selectedOptions: payload.selectedOptions,
      note: note || undefined,
    },
  ];
}
