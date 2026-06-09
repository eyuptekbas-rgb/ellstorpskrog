"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import MobilePageLogo from "@/components/brand/MobilePageLogo";
import CategoryNav from "@/components/menu/CategoryNav";
import CartDrawer from "@/components/menu/CartDrawer";
import FloatingCartButton from "@/components/menu/FloatingCartButton";
import ProductCard from "@/components/menu/ProductCard";
import { getCategoryEmoji } from "@/lib/menu/constants";
import { loadCart, saveCart, type CartItem } from "@/lib/cart";
import type { MenuCategory, MenuProduct } from "@/lib/menu";

type Props = {
  categories: MenuCategory[];
};

export default function MenuClient({ categories }: Props) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const isScrollingRef = useRef(false);

  useEffect(() => {
    setCart(loadCart());
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    saveCart(cart);
  }, [cart, cartLoaded]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const getCartQuantity = useCallback(
    (productId: string) =>
      cart.find((item) => item.id === productId)?.quantity ?? 0,
    [cart]
  );

  const addToCart = (product: MenuProduct, categorySlug: string) => {
    if (product.soldOut) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
          categorySlug,
        },
      ];
    });
  };

  const increaseQuantity = (productId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (productId: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const goToCheckout = () => {
    saveCart(cart);
    setCartOpen(false);
    router.push("/checkout");
  };

  const scrollToCategory = (categoryId: string) => {
    isScrollingRef.current = true;
    setActiveCategory(categoryId);
    sectionRefs.current[categoryId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 600);
  };

  useEffect(() => {
    if (categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target.id) {
          setActiveCategory(top.target.id.replace("category-", ""));
        }
      },
      {
        rootMargin: "-150px 0px -55% 0px",
        threshold: [0, 0.15, 0.4],
      }
    );

    categories.forEach((cat) => {
      const el = sectionRefs.current[cat.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-20 text-center">
        <h1 className="font-serif text-3xl mb-3">Meny</h1>
        <p className="text-white/50">Inga produkter tillgängliga just nu.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white lg:pb-16">
      <header className="border-b border-white/[0.05] px-[var(--content-px)] pb-10 pt-6 sm:pt-7">
        <MobilePageLogo className="mx-auto mb-5" priority />
        <p className="section-label mb-4">Beställ online</p>
        <h1 className="text-display text-3xl text-white sm:text-4xl lg:text-[2.75rem]">
          Meny
        </h1>
        <p className="text-body mt-4 max-w-lg text-sm text-white/48 sm:text-base">
          Välj dina favoriter och lägg till i varukorgen — snabb avhämtning
          eller hemleverans.
        </p>
      </header>

      <CategoryNav
        categories={categories}
        activeCategoryId={activeCategory}
        onSelect={scrollToCategory}
      />

      {/* All categories */}
      <div className="mx-auto max-w-6xl space-y-16 px-[var(--content-px)] py-10">
        {categories.map((category) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            ref={(el) => {
              sectionRefs.current[category.id] = el;
            }}
            className="scroll-mt-[calc(var(--header-height)+5rem)]"
          >
            <div className="mb-7 flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-2xl">
                {getCategoryEmoji(category.slug)}
              </span>
              <div>
                <h2 className="text-display text-2xl text-white sm:text-3xl">
                  {category.name}
                </h2>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-white/35">
                  {category.products.length}{" "}
                  {category.products.length === 1 ? "rätt" : "rätter"}
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {category.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categorySlug={category.slug}
                  quantity={getCartQuantity(product.id)}
                  onAdd={() => addToCart(product, category.slug)}
                  onIncrease={() => increaseQuantity(product.id)}
                  onDecrease={() => decreaseQuantity(product.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Mobile checkout strip */}
      {totalItems > 0 && (
        <div className="fixed bottom-[calc(var(--bottom-nav-height)+var(--bottom-nav-fab-overflow)+env(safe-area-inset-bottom,0px)+0.5rem)] left-0 right-0 z-30 px-4 lg:hidden">
          <button
            type="button"
            onClick={goToCheckout}
            className="btn-primary flex w-full items-center justify-between !rounded-2xl !px-5 !py-4 shadow-xl shadow-black/40"
          >
            <span>Till kassan</span>
            <span>
              {totalItems} st · {totalPrice} kr →
            </span>
          </button>
        </div>
      )}

      <FloatingCartButton
        totalItems={totalItems}
        totalPrice={totalPrice}
        onOpenCart={() => setCartOpen(true)}
        onCheckout={goToCheckout}
      />

      <CartDrawer
        open={cartOpen}
        cart={cart}
        totalPrice={totalPrice}
        onClose={() => setCartOpen(false)}
        onIncrease={increaseQuantity}
        onDecrease={decreaseQuantity}
        onRemove={removeFromCart}
        onCheckout={goToCheckout}
      />
    </div>
  );
}
