export type PosCatalogProduct = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName: string;
  soldOut: boolean;
  barcode?: string | null;
};

export type QuickSaleLine = {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  note?: string;
};

export type QuickSaleCart = {
  lines: QuickSaleLine[];
  discountPercent: number;
  discountAmount: number;
  couponCode: string | null;
  couponAmount: number;
  giftCardAmount: number;
  customNote: string;
};

const FAVORITES_KEY = "pos-favorites";
const COUPONS_KEY = "pos-coupons";

export function loadPosFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function togglePosFavorite(productId: string): string[] {
  const current = loadPosFavorites();
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
  if (typeof window !== "undefined") {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }
  return next;
}

export type PosCoupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
};

export function loadPosCoupons(): PosCoupon[] {
  if (typeof window === "undefined") {
    return [{ code: "WELCOME10", type: "percent", value: 10 }];
  }
  try {
    const raw = localStorage.getItem(COUPONS_KEY);
    if (!raw) return [{ code: "WELCOME10", type: "percent", value: 10 }];
    return JSON.parse(raw) as PosCoupon[];
  } catch {
    return [{ code: "WELCOME10", type: "percent", value: 10 }];
  }
}

export function resolveCoupon(code: string): PosCoupon | null {
  const normalized = code.trim().toUpperCase();
  return loadPosCoupons().find((c) => c.code.toUpperCase() === normalized) ?? null;
}

export function emptyCart(): QuickSaleCart {
  return {
    lines: [],
    discountPercent: 0,
    discountAmount: 0,
    couponCode: null,
    couponAmount: 0,
    giftCardAmount: 0,
    customNote: "",
  };
}

export function cartSubtotal(cart: QuickSaleCart): number {
  return cart.lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );
}

export function cartTotal(cart: QuickSaleCart): number {
  const subtotal = cartSubtotal(cart);
  const percentOff = Math.round(subtotal * (cart.discountPercent / 100));
  const total =
    subtotal -
    percentOff -
    cart.discountAmount -
    cart.couponAmount -
    cart.giftCardAmount;
  return Math.max(0, total);
}

export function applyCoupon(cart: QuickSaleCart, code: string): QuickSaleCart {
  const coupon = resolveCoupon(code);
  if (!coupon) return cart;
  const subtotal = cartSubtotal(cart);
  const couponAmount =
    coupon.type === "percent"
      ? Math.round(subtotal * (coupon.value / 100))
      : coupon.value;
  return {
    ...cart,
    couponCode: coupon.code,
    couponAmount: Math.min(couponAmount, subtotal),
  };
}

export type RefundDraft = {
  orderId: string;
  orderNumber: string;
  amount: number;
  reason: string;
};

export function createRefundDraft(
  orderId: string,
  orderNumber: string,
  amount: number,
  reason: string
): RefundDraft {
  return { orderId, orderNumber, amount, reason };
}

export function filterCatalog(
  products: PosCatalogProduct[],
  search: string
): PosCatalogProduct[] {
  const q = search.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q) ||
      p.barcode?.includes(q)
  );
}

export function findProductByBarcode(
  products: PosCatalogProduct[],
  barcode: string
): PosCatalogProduct | null {
  const code = barcode.trim();
  if (!code) return null;
  return (
    products.find((p) => p.barcode === code) ??
    products.find((p) => p.id === code) ??
    null
  );
}
