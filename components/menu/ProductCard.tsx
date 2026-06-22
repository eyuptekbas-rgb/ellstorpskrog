"use client";

import { Minus, Plus } from "lucide-react";
import { memo, useState, type ReactNode } from "react";
import ProductImage from "@/components/ui/ProductImage";
import { getProductDisplayName } from "@/lib/menu/product-display";
import type { MenuProduct } from "@/lib/menu";

type Props = {
  product: MenuProduct;
  categorySlug: string;
  quantity: number;
  /** Press + on a fresh item: parent decides direct-add vs customize sheet. */
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  /** Active search query — when set, matching text in name/desc is highlighted. */
  highlight?: string;
};

/**
 * Menu V3 — Compact horizontal product card (~96–110px tall).
 *
 * Layout: [72–80px image] [name · two-line description · copper price]
 *         [round add button → inline stepper after adding].
 *
 * Goal: 3–5 products visible per screen with fast scanning and one-tap add.
 * Business logic (add / customize / quantity) is owned by the parent.
 */
function highlightText(text: string, query?: string): ReactNode {
  const q = query?.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: ReactNode[] = [];
  let from = 0;
  let idx = lower.indexOf(needle, from);
  let key = 0;
  while (idx !== -1) {
    if (idx > from) parts.push(text.slice(from, idx));
    parts.push(
      <mark key={key++} className="menu-hl">
        {text.slice(idx, idx + needle.length)}
      </mark>
    );
    from = idx + needle.length;
    idx = lower.indexOf(needle, from);
  }
  if (from < text.length) parts.push(text.slice(from));
  return parts;
}

function ProductCard({
  product,
  categorySlug,
  quantity,
  onAdd,
  onIncrease,
  onDecrease,
  highlight,
}: Props) {
  const soldOut = product.soldOut;
  const displayName = getProductDisplayName(product, categorySlug);
  const imageKey = `${product.image ?? ""}:${categorySlug}`;
  const [loadedImageKey, setLoadedImageKey] = useState<string | null>(null);
  const imageLoaded = loadedImageKey === imageKey;

  return (
    <article
      className={`menu-product-card${soldOut ? " menu-product-card--sold-out" : ""}`}
      aria-label={displayName}
    >
      <div className="menu-product-card__media">
        {!imageLoaded && (
          <span className="menu-product-card__shimmer" aria-hidden />
        )}
        <ProductImage
          src={product.image}
          categorySlug={categorySlug}
          alt={displayName}
          fill
          overlay={false}
          className={`menu-product-card__photo object-cover${
            soldOut ? " menu-product-card__photo--sold-out" : ""
          }${imageLoaded ? " menu-product-card__photo--loaded" : ""}`}
          sizes="80px"
          onLoad={() => setLoadedImageKey(imageKey)}
        />
        {soldOut && <span className="menu-product-card__badge">Slut</span>}
      </div>

      <div className="menu-product-card__body">
        <h3 className="menu-product-card__title">
          {highlightText(displayName, highlight)}
        </h3>
        {product.description ? (
          <p className="menu-product-card__desc">
            {highlightText(product.description, highlight)}
          </p>
        ) : null}
        <p className="menu-product-card__price">
          {product.price}
          <span> kr</span>
        </p>
      </div>

      <div className="menu-product-card__actions">
        {soldOut ? (
          <span className="menu-product-card__sold-out-action">Slutsåld</span>
        ) : quantity > 0 ? (
          <div
            className="menu-product-card__stepper"
            role="group"
            aria-label={`Antal ${displayName}`}
          >
            <button
              type="button"
              onClick={onDecrease}
              aria-label={`Minska antal ${displayName}`}
              className="menu-product-card__stepper-btn"
            >
              <Minus size={16} strokeWidth={2.5} aria-hidden />
            </button>
            <span className="menu-product-card__stepper-qty" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={onIncrease}
              aria-label={`Öka antal ${displayName}`}
              className="menu-product-card__stepper-btn menu-product-card__stepper-btn--plus"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Lägg till ${displayName}`}
            className="menu-product-card__add"
          >
            <Plus size={20} strokeWidth={2.75} aria-hidden />
          </button>
        )}
      </div>
    </article>
  );
}

export default memo(ProductCard);
