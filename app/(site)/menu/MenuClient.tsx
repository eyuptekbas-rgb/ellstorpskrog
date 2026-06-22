"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTenantPublicPath } from "@/components/tenant/TenantPublicPathProvider";
import { Clock, Flame, SearchX } from "lucide-react";
import CategoryNav from "@/components/menu/CategoryNav";
import CategoryQuickJump from "@/components/menu/CategoryQuickJump";
import CartDrawer from "@/components/menu/CartDrawer";
import FloatingCartButton from "@/components/menu/FloatingCartButton";
import MenuSearch from "@/components/menu/MenuSearch";
import ProductCard from "@/components/menu/ProductCard";
import ProductCustomizeSheet from "@/components/menu/ProductCustomizeSheet";
import { getCategoryCountLabel, getCategoryEmoji } from "@/lib/menu/constants";
import {
  addOrMergeCartItem,
  loadCart,
  loadOrderNote,
  saveCart,
  saveOrderNote,
  type CartItem,
} from "@/lib/cart";
import type { MenuCategory, MenuProduct } from "@/lib/menu";

type CustomizeTarget = {
  product: MenuProduct;
  categorySlug: string;
  categorySortOrder: number;
  productSortOrder: number;
  menuNumber?: number;
};

type ProductEntry = {
  product: MenuProduct;
  category: MenuCategory;
};

type Props = {
  categories: MenuCategory[];
  /** Most-ordered product IDs (public). */
  popularProductIds: string[];
  /** Recently-ordered product IDs for the signed-in customer, or null when not
   *  logged in — in which case the section is never rendered. */
  recentProductIds: string[] | null;
};

const CATEGORY_SLUG_ORDER = [
  "vara-goda-pizzor",
  "a-la-carte",
  "kebab-kyckling-falafel-gyros",
  "hamburgare",
  "pastaratter",
  "plankstek",
  "smaratter",
  "efterratt",
  "drycker",
] as const;

export default function MenuClient({
  categories,
  popularProductIds,
  recentProductIds,
}: Props) {
  const router = useRouter();
  const tp = useTenantPublicPath();
  const orderedCategories = useMemo(() => {
    const rank = new Map<string, number>(
      CATEGORY_SLUG_ORDER.map((slug, index) => [slug, index])
    );
    return [...categories].sort((a, b) => {
      const aRank = rank.get(a.slug) ?? 999;
      const bRank = rank.get(b.slug) ?? 999;
      if (aRank !== bRank) return aRank - bRank;
      return a.sortOrder - b.sortOrder;
    });
  }, [categories]);

  const [activeCategory, setActiveCategory] = useState(
    orderedCategories[0]?.id ?? ""
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [customizeTarget, setCustomizeTarget] = useState<CustomizeTarget | null>(
    null
  );
  const [query, setQuery] = useState("");
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const categoryNavRef = useRef<HTMLElement | null>(null);

  // Flat index: productId → { product, category }. Used to resolve discovery
  // IDs and to search across the whole menu.
  const productIndex = useMemo(() => {
    const map = new Map<string, ProductEntry>();
    for (const category of orderedCategories) {
      for (const product of category.products) {
        if (!map.has(product.id)) map.set(product.id, { product, category });
      }
    }
    return map;
  }, [orderedCategories]);

  const allEntries = useMemo(() => {
    const entries: ProductEntry[] = [];
    for (const category of orderedCategories) {
      for (const product of category.products) {
        entries.push({ product, category });
      }
    }
    return entries;
  }, [orderedCategories]);

  const resolveEntries = useCallback(
    (ids: string[]): ProductEntry[] => {
      const seen = new Set<string>();
      const result: ProductEntry[] = [];
      for (const id of ids) {
        if (seen.has(id)) continue;
        const entry = productIndex.get(id);
        if (entry) {
          seen.add(id);
          result.push(entry);
        }
      }
      return result;
    },
    [productIndex]
  );

  const popularEntries = useMemo(
    () => resolveEntries(popularProductIds).slice(0, 8),
    [resolveEntries, popularProductIds]
  );
  const recentEntries = useMemo(
    () => (recentProductIds ? resolveEntries(recentProductIds).slice(0, 8) : []),
    [resolveEntries, recentProductIds]
  );

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return allEntries.filter(
      ({ product }) =>
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery)
    );
  }, [isSearching, normalizedQuery, allEntries]);

  const activeCategoryId = useMemo(() => {
    if (orderedCategories.length === 0) return "";
    if (orderedCategories.some((cat) => cat.id === activeCategory)) {
      return activeCategory;
    }
    return orderedCategories[0].id;
  }, [orderedCategories, activeCategory]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setCart(loadCart());
      setOrderNote(loadOrderNote());
      setCartLoaded(true);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!cartLoaded || orderedCategories.length === 0) return;
    const frameId = window.requestAnimationFrame(() => {
      setCart((prev) => {
        let changed = false;
        const next = prev.map((item) => {
          if (item.categorySortOrder != null) return item;
          const category = orderedCategories.find(
            (c) => c.slug === item.categorySlug
          );
          const product = category?.products.find((p) => p.id === item.id);
          if (!category || !product) return item;
          changed = true;
          return {
            ...item,
            categorySortOrder: category.sortOrder,
            productSortOrder: product.sortOrder,
          };
        });
        return changed ? next : prev;
      });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [cartLoaded, orderedCategories]);

  useEffect(() => {
    if (!cartLoaded) return;
    saveCart(cart);
  }, [cart, cartLoaded]);

  useEffect(() => {
    saveOrderNote(orderNote);
  }, [orderNote]);

  useEffect(() => {
    const openCart = () => setCartOpen(true);
    window.addEventListener("open-cart-drawer", openCart);
    return () => window.removeEventListener("open-cart-drawer", openCart);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const getCartQuantity = useCallback(
    (productId: string) =>
      cart
        .filter((item) => item.id === productId)
        .reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const getProductLines = useCallback(
    (productId: string) => cart.filter((item) => item.id === productId),
    [cart]
  );

  const openCustomize = (product: MenuProduct, category: MenuCategory) => {
    if (product.soldOut) return;
    setCustomizeTarget({
      product,
      categorySlug: category.slug,
      categorySortOrder: category.sortOrder,
      productSortOrder: product.sortOrder,
    });
  };

  const handleCustomizeConfirm = (payload: {
    quantity: number;
    selectedOptions: CartItem["selectedOptions"];
    note: string;
  }) => {
    if (!customizeTarget) return;
    const { product, categorySlug, categorySortOrder, productSortOrder } =
      customizeTarget;
    setCart((prev) =>
      addOrMergeCartItem(prev, {
        productId: product.id,
        name: product.name,
        basePrice: product.price,
        image: product.image,
        categorySlug,
        categorySortOrder,
        productSortOrder,
        quantity: payload.quantity,
        selectedOptions: payload.selectedOptions,
        note: payload.note,
      })
    );
  };

  /**
   * Menu V3 ordering rule:
   *   • Product WITHOUT options → add instantly (no sheet, no navigation).
   *   • Product WITH options    → open the customize sheet.
   * Scroll position is never touched.
   */
  const addProduct = (product: MenuProduct, category: MenuCategory) => {
    if (product.soldOut) return;
    if (product.options.length > 0) {
      openCustomize(product, category);
      return;
    }
    setCart((prev) =>
      addOrMergeCartItem(prev, {
        productId: product.id,
        name: product.name,
        basePrice: product.price,
        image: product.image,
        categorySlug: category.slug,
        categorySortOrder: category.sortOrder,
        productSortOrder: product.sortOrder,
        quantity: 1,
        selectedOptions: [],
        note: "",
      })
    );
  };

  const increaseProduct = (product: MenuProduct, category: MenuCategory) => {
    const lines = getProductLines(product.id);
    if (lines.length === 1) {
      increaseLine(lines[0].lineKey);
      return;
    }
    openCustomize(product, category);
  };

  const decreaseProduct = (productId: string) => {
    const lines = getProductLines(productId);
    if (lines.length === 0) return;
    decreaseLine(lines[lines.length - 1].lineKey);
  };

  const increaseLine = (lineKey: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.lineKey === lineKey
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseLine = (lineKey: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.lineKey === lineKey
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeLine = (lineKey: string) => {
    setCart((prev) => prev.filter((item) => item.lineKey !== lineKey));
  };

  const goToCheckout = useCallback(() => {
    if (cart.length === 0) return;
    saveCart(cart);
    saveOrderNote(orderNote);
    document.body.style.overflow = "";
    setCartOpen(false);
    window.requestAnimationFrame(() => {
      router.push(tp("/checkout"));
    });
  }, [cart, orderNote, router, tp]);

  const scrollToCategory = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    sectionRefs.current[categoryId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const categoryIds = useMemo(
    () => orderedCategories.map((category) => category.id),
    [orderedCategories]
  );

  useEffect(() => {
    if (categoryIds.length === 0 || isSearching) return;

    let alive = true;
    let rafId = 0;

    const syncActiveCategory = () => {
      const nav = categoryNavRef.current;
      if (!nav) return;

      const anchor = nav.getBoundingClientRect().bottom;
      let nextActiveId = categoryIds[0];

      for (const categoryId of categoryIds) {
        const section = sectionRefs.current[categoryId];
        if (!section) continue;
        if (section.getBoundingClientRect().top <= anchor + 1) {
          nextActiveId = categoryId;
        } else {
          break;
        }
      }

      setActiveCategory((prev) => (prev === nextActiveId ? prev : nextActiveId));
    };

    const tick = () => {
      if (!alive) return;
      if (document.visibilityState === "visible") {
        syncActiveCategory();
      }
      rafId = requestAnimationFrame(tick);
    };

    const handleLayoutChange = () => {
      syncActiveCategory();
    };

    rafId = requestAnimationFrame(tick);
    window.addEventListener("resize", handleLayoutChange, { passive: true });
    window.addEventListener("orientationchange", handleLayoutChange);
    document.addEventListener("visibilitychange", handleLayoutChange);

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("orientationchange", handleLayoutChange);
      document.removeEventListener("visibilitychange", handleLayoutChange);
    };
  }, [categoryIds, isSearching]);

  if (orderedCategories.length === 0) {
    return (
      <div className="menu-pro-empty">
        <h1 className="menu-pro-empty__title">Meny</h1>
        <p className="menu-pro-empty__text">
          Inga produkter tillgängliga just nu. Kom tillbaka snart.
        </p>
      </div>
    );
  }

  const productTotal = orderedCategories.reduce(
    (sum, c) => sum + c.products.length,
    0
  );

  const renderCard = (entry: ProductEntry) => {
    const { product, category } = entry;
    return (
      <ProductCard
        key={`${category.id}-${product.id}`}
        product={product}
        categorySlug={category.slug}
        quantity={getCartQuantity(product.id)}
        onAdd={() => addProduct(product, category)}
        onIncrease={() => increaseProduct(product, category)}
        onDecrease={() => decreaseProduct(product.id)}
        highlight={isSearching ? query : undefined}
      />
    );
  };

  return (
    <div className="menu-pro min-h-screen bg-[var(--background)] text-[var(--foreground)] lg:pb-[var(--menu-space-16)]">
      <header className="menu-pro-header px-[var(--content-px)] pb-0 pt-[var(--menu-space-3)] lg:pb-[var(--menu-space-2)] lg:pt-[var(--menu-space-6)]">
        <div className="lg:hidden">
          <h1 className="menu-pro-header__title">Meny</h1>
          <p className="menu-pro-header__meta">
            {productTotal} {productTotal === 1 ? "rätt" : "rätter"}
          </p>
        </div>

        <div className="mb-[var(--menu-space-4)] hidden lg:block">
          <p className="section-label mb-[var(--menu-space-3)]">Beställ online</p>
          <h1 className="text-display text-4xl text-white">Meny</h1>
          <p className="text-body mt-3 max-w-lg text-base text-[color-mix(in_srgb,var(--menu-color-white)_48%,transparent)]">
            Välj dina favoriter och lägg till i varukorgen — snabb avhämtning
            eller hemleverans.
          </p>
        </div>

        <div className="menu-pro-search mt-[var(--menu-space-3)] lg:mt-0 lg:max-w-md">
          <MenuSearch value={query} onChange={setQuery} />
        </div>
      </header>

      {!isSearching && (
        <CategoryNav
          ref={categoryNavRef}
          categories={orderedCategories}
          activeCategoryId={activeCategoryId}
          onSelect={scrollToCategory}
          onQuickJump={() => setQuickJumpOpen(true)}
        />
      )}

      <div className="menu-pro-sections mx-auto max-w-3xl px-[var(--content-px)] pb-[var(--menu-space-6)] pt-[var(--menu-space-4)] lg:pt-[var(--menu-space-6)]">
        {isSearching ? (
          <section className="menu-pro-section" aria-label="Sökresultat">
            <div className="menu-pro-section__head">
              <div className="menu-pro-section__title-wrap min-w-0">
                <h2 className="menu-pro-section__title">Sökresultat</h2>
                <p className="menu-pro-section__count">
                  {searchResults.length}{" "}
                  {searchResults.length === 1 ? "träff" : "träffar"} för
                  &ldquo;{query.trim()}&rdquo;
                </p>
              </div>
            </div>

            {searchResults.length > 0 ? (
              <div className="menu-product-list">
                {searchResults.map(renderCard)}
              </div>
            ) : (
              <div className="menu-pro-empty menu-pro-empty--inline">
                <SearchX
                  size={26}
                  className="menu-pro-empty__icon"
                  aria-hidden
                />
                <p className="menu-pro-empty__text">
                  Inga rätter matchar din sökning.
                </p>
              </div>
            )}
          </section>
        ) : (
          <>
            {recentEntries.length > 0 && (
              <section
                className="menu-pro-section menu-pro-section--discovery"
                aria-label="Senast beställt"
              >
                <div className="menu-pro-section__head">
                  <span className="menu-pro-section__emoji" aria-hidden>
                    <Clock size={18} aria-hidden />
                  </span>
                  <div className="menu-pro-section__title-wrap min-w-0">
                    <h2 className="menu-pro-section__title">Senast beställt</h2>
                    <p className="menu-pro-section__count">Dina favoriter igen</p>
                  </div>
                  <span className="menu-pro-section__divider" aria-hidden />
                </div>
                <div className="menu-product-list">
                  {recentEntries.map(renderCard)}
                </div>
              </section>
            )}

            {popularEntries.length > 0 && (
              <section
                className="menu-pro-section menu-pro-section--discovery"
                aria-label="Populärt"
              >
                <div className="menu-pro-section__head">
                  <span className="menu-pro-section__emoji" aria-hidden>
                    <Flame size={18} aria-hidden />
                  </span>
                  <div className="menu-pro-section__title-wrap min-w-0">
                    <h2 className="menu-pro-section__title">Populärt</h2>
                    <p className="menu-pro-section__count">Mest beställda just nu</p>
                  </div>
                  <span className="menu-pro-section__divider" aria-hidden />
                </div>
                <div className="menu-product-list">
                  {popularEntries.map(renderCard)}
                </div>
              </section>
            )}

            {orderedCategories.map((category) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                ref={(el) => {
                  sectionRefs.current[category.id] = el;
                }}
                className="menu-pro-section scroll-mt-[calc(var(--header-height-mobile)+3.75rem)] lg:scroll-mt-[calc(var(--header-height)+5rem)]"
              >
                <div className="menu-pro-section__head">
                  <span className="menu-pro-section__emoji" aria-hidden>
                    {getCategoryEmoji(category.slug)}
                  </span>
                  <div className="menu-pro-section__title-wrap min-w-0">
                    <h2 className="menu-pro-section__title">{category.name}</h2>
                    <p className="menu-pro-section__count">
                      {getCategoryCountLabel(
                        category.slug,
                        category.products.length
                      )}
                    </p>
                  </div>
                  <span className="menu-pro-section__divider" aria-hidden />
                </div>

                <div className="menu-product-list">
                  {category.products.map((product) =>
                    renderCard({ product, category })
                  )}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

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
        orderNote={orderNote}
        onOrderNoteChange={setOrderNote}
        onClose={() => setCartOpen(false)}
        onIncrease={increaseLine}
        onDecrease={decreaseLine}
        onRemove={removeLine}
        onCheckout={goToCheckout}
      />

      <ProductCustomizeSheet
        product={customizeTarget?.product ?? null}
        categorySlug={customizeTarget?.categorySlug ?? "pizza"}
        open={Boolean(customizeTarget)}
        onClose={() => setCustomizeTarget(null)}
        onConfirm={handleCustomizeConfirm}
      />

      {quickJumpOpen && (
        <CategoryQuickJump
          open={quickJumpOpen}
          categories={orderedCategories}
          activeCategoryId={activeCategoryId}
          onSelect={scrollToCategory}
          onClose={() => setQuickJumpOpen(false)}
        />
      )}
    </div>
  );
}
