"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import {
  getCartLineUnitPrice,
  type CartItemOption,
} from "@/lib/cart";
import type { MenuProduct } from "@/lib/menu";

/**
 * Matches all elements reachable via Tab.
 * Used for initial focus and focus-trap cycling.
 */
const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type Props = {
  product: MenuProduct | null;
  categorySlug: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    quantity: number;
    selectedOptions: CartItemOption[];
    note: string;
  }) => void;
};

export default function ProductCustomizeSheet({
  product,
  categorySlug,
  open,
  onClose,
  onConfirm,
}: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Reset form state when the sheet opens for a new product.
  useEffect(() => {
    if (open && product) {
      queueMicrotask(() => {
        setQuantity(1);
        setSelectedIds(new Set());
        setNote("");
      });
    }
  }, [open, product]);

  // Escape key + body scroll lock (pre-existing behaviour, unchanged).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  /**
   * Phase 5B: Background inert · initial focus · focus restore
   *
   * This component only mounts when the sheet is open (the parent renders
   * null when `product` is null).  Therefore using [] as the dependency array
   * is intentional: setup runs once on mount (= open), cleanup runs once on
   * unmount (= close).
   *
   * On mount:
   *   1. Save the triggering element for focus restore.
   *   2. Mark every DOM sibling of the dialog as `inert` + `aria-hidden` so
   *      neither keyboard nor screen-reader can reach content behind the sheet.
   *   3. Move focus to the first interactive element inside the dialog.
   *
   * On unmount:
   *   1. Remove only the attributes we personally added (safe with other
   *      components that manage their own aria-hidden).
   *   2. Return focus to the triggering element.
   */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // 1. Save opener.
    openerRef.current = document.activeElement as HTMLElement;

    // 2. Suppress background — collect and mark siblings.
    const parent = dialog.parentElement;
    const inerted: Element[] = [];
    const hiddenFromAt: Element[] = [];

    if (parent) {
      Array.from(parent.children).forEach((el) => {
        if (el === dialog) return;
        if (!el.hasAttribute("inert")) {
          el.setAttribute("inert", "");
          inerted.push(el);
        }
        if (el.getAttribute("aria-hidden") !== "true") {
          el.setAttribute("aria-hidden", "true");
          hiddenFromAt.push(el);
        }
      });
    }

    // 3. Move focus to first interactive element.
    const focusable =
      dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    focusable[0]?.focus();

    return () => {
      // Restore background.
      inerted.forEach((el) => el.removeAttribute("inert"));
      hiddenFromAt.forEach((el) => el.removeAttribute("aria-hidden"));

      // Restore focus to the element that opened the sheet.
      openerRef.current?.focus();
      openerRef.current = null;
    };
  }, []);

  const selectedOptions = useMemo(() => {
    if (!product) return [];
    return product.options.filter((o) => selectedIds.has(o.id));
  }, [product, selectedIds]);

  const unitPrice = product
    ? getCartLineUnitPrice(product.price, selectedOptions)
    : 0;
  const lineTotal = unitPrice * quantity;

  /**
   * Phase 5B: Focus trap — Tab and Shift+Tab cycle within the sheet.
   * Wraps from last → first (Tab) and first → last (Shift+Tab).
   * Must be defined before the early return to satisfy Rules of Hooks.
   */
  const trapFocus = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  if (!product) return null;

  const toggleOption = (optionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm({
      quantity,
      selectedOptions,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <>
      <div
        className={`product-sheet-backdrop ${open ? "product-sheet-backdrop--open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/*
        role="dialog" aria-modal="true" — WAI-ARIA dialog pattern.
        aria-labelledby points to the visible product-name heading.
        aria-describedby points to the product description paragraph.
        onKeyDown handles Tab / Shift+Tab focus trap.
      */}
      <div
        ref={dialogRef}
        className={`product-sheet ${open ? "product-sheet--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customize-sheet-title"
        aria-describedby="customize-sheet-desc"
        onKeyDown={trapFocus}
      >
        <div className="product-sheet__handle" aria-hidden="true" />

        <div className="product-sheet__header">
          <div className="product-sheet__hero">
            <div className="product-sheet__image">
              <ProductImage
                src={product.image}
                categorySlug={categorySlug}
                alt={product.name}
                fill
                overlay={false}
                className="object-cover"
                sizes="88px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="customize-sheet-title"
                className="product-sheet__title"
              >
                {product.name}
              </h2>
              <p
                id="customize-sheet-desc"
                className="product-sheet__desc"
              >
                {product.description}
              </p>
              <p className="product-sheet__base-price">
                Från {product.price} kr
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="product-sheet__close"
            aria-label="Stäng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="product-sheet__body">
          {product.options.length > 0 && (
            <section className="product-sheet__section">
              <h3 className="product-sheet__section-title">Extra tillbehör</h3>
              <ul className="product-sheet__options">
                {product.options.map((option) => {
                  const checked = selectedIds.has(option.id);
                  return (
                    <li key={option.id}>
                      <label
                        className={`product-sheet__option ${checked ? "product-sheet__option--checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOption(option.id)}
                          className="sr-only"
                        />
                        <span className="product-sheet__option-name">
                          {option.name}
                        </span>
                        <span className="product-sheet__option-price">
                          {option.priceModifier > 0
                            ? `+${option.priceModifier} kr`
                            : "Gratis"}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="product-sheet__section">
            <h3 className="product-sheet__section-title">
              Instruktioner <span className="font-normal text-[var(--menu-text-subtle)]">(valfritt)</span>
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="T.ex. utan lök, extra stark…"
              rows={3}
              className="product-sheet__note"
              maxLength={200}
            />
          </section>

          <div className="product-sheet__qty">
            <span className="product-sheet__section-title">Antal</span>
            <div className="product-sheet__stepper">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="product-sheet__stepper-btn"
                aria-label="Minska antal"
              >
                <Minus size={18} />
              </button>
              <span className="product-sheet__stepper-qty">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="product-sheet__stepper-btn product-sheet__stepper-btn--plus"
                aria-label="Öka antal"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="product-sheet__footer">
          <button
            type="button"
            onClick={handleConfirm}
            className="product-sheet__confirm"
          >
            Lägg till · {lineTotal} kr
          </button>
        </div>
      </div>
    </>
  );
}
