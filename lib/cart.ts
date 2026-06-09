export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  categorySlug?: string;
};

const CART_KEY = "ellstorps-cart";

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
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}
