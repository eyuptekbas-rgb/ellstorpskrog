"use client";

import { useCallback, useEffect, useRef } from "react";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { sortCartByMenuOrder, type CartItem } from "@/lib/cart";

/**
 * Matches all interactive elements that are reachable via Tab.
 * Used for both initial focus and focus-trap cycling.
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
  open: boolean;
  cart: CartItem[];
  totalPrice: number;
  orderNote: string;
  onOrderNoteChange: (value: string) => void;
  onClose: () => void;
  onIncrease: (lineKey: string) => void;
  onDecrease: (lineKey: string) => void;
  onRemove: (lineKey: string) => void;
  onCheckout: () => void;
};

export default function CartDrawer({
  open,
  cart,
  totalPrice,
  orderNote,
  onOrderNoteChange,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
}: Props) {
  const sortedCart = sortCartByMenuOrder(cart);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  /**
   * Phase 5A: Scroll lock · background inert · focus management
   *
   * On open:
   *   1. Save the triggering element so focus can be restored on close.
   *   2. Lock body scroll.
   *   3. Mark every DOM sibling of the dialog (i.e. everything behind the
   *      overlay) as `inert` + `aria-hidden` so neither keyboard nor AT can
   *      reach background content.
   *   4. Remove `inert` from the dialog itself (which we set while closed).
   *   5. Move focus to the first interactive element inside the drawer.
   *
   * On close (cleanup):
   *   1. Unlock body scroll.
   *   2. Restore only the attributes we personally added (safe with nested
   *      dialogs / components that manage their own aria-hidden).
   *   3. Re-apply `inert` to the dialog so hidden elements are unreachable.
   *   4. Return focus to the element that originally opened the drawer.
   */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const parent = dialog.parentElement;
    const siblings: Element[] = parent
      ? Array.from(parent.children).filter((child) => child !== dialog)
      : [];

    // Track only what we add so we never strip pre-existing attributes.
    const inerted: Element[] = [];
    const hiddenFromAt: Element[] = [];

    if (open) {
      // 1. Save the opener.
      openerRef.current = document.activeElement as HTMLElement;

      // 2. Body scroll lock.
      document.body.style.overflow = "hidden";

      // 3. Make the dialog itself interactive (it was inert while closed).
      dialog.removeAttribute("inert");

      // 4. Suppress background.
      siblings.forEach((el) => {
        if (!el.hasAttribute("inert")) {
          el.setAttribute("inert", "");
          inerted.push(el);
        }
        if (el.getAttribute("aria-hidden") !== "true") {
          el.setAttribute("aria-hidden", "true");
          hiddenFromAt.push(el);
        }
      });

      // 5. Initial focus.
      const focusable =
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
      focusable[0]?.focus();
    } else {
      // Closed: mark the dialog inert so Tab cannot reach hidden elements.
      dialog.setAttribute("inert", "");
    }

    return () => {
      // Restore body scroll.
      document.body.style.overflow = "";

      // Restore background elements (only the ones we suppressed).
      inerted.forEach((el) => el.removeAttribute("inert"));
      hiddenFromAt.forEach((el) => el.removeAttribute("aria-hidden"));

      // Restore focus only when cleaning up the open state.
      if (open) {
        openerRef.current?.focus();
        openerRef.current = null;
      }
    };
  }, [open]);

  /**
   * Phase 5A: Escape key closes the drawer and restores focus.
   * The cleanup in the effect above handles the focus restore, so here
   * we only need to call onClose().
   */
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  /**
   * Phase 5A: Focus trap — Tab and Shift+Tab cycle within the drawer.
   * Wraps from last → first (Tab) and first → last (Shift+Tab).
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

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[var(--menu-z-cart-drawer)] bg-[var(--menu-overlay-strong)] backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/*
        role="dialog" aria-modal="true" — WAI-ARIA dialog pattern.
        aria-labelledby points to the visible "Varukorg" heading.
        aria-describedby points to the item-count subtitle.
        onKeyDown handles the focus trap (Tab / Shift+Tab).
      */}
      <div
        ref={dialogRef}
        className={`fixed bottom-0 left-0 right-0 z-[var(--menu-z-cart-drawer)] flex max-h-[88vh] flex-col rounded-t-[var(--menu-radius-sheet)] border-t border-[color-mix(in_srgb,var(--brand-copper)_25%,transparent)] bg-[var(--menu-color-surface)] shadow-[var(--menu-shadow-sheet)] transition-transform duration-[var(--menu-motion-sheet)] ease-[var(--menu-ease-out)] ${
          open ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        aria-describedby="cart-drawer-desc"
        onKeyDown={trapFocus}
      >
        <div className="shrink-0 border-b border-[var(--menu-border-soft)] px-[var(--menu-space-5)] pb-[var(--menu-space-4)] pt-[var(--menu-space-3)]">
          <div className="mx-auto mb-[var(--menu-space-4)] h-1 w-10 rounded-[var(--menu-radius-pill)] bg-[color-mix(in_srgb,var(--menu-color-white)_20%,transparent)]" />
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="cart-drawer-title"
                className="font-serif text-2xl text-[var(--menu-text-primary)]"
              >
                Varukorg
              </h2>
              <p
                id="cart-drawer-desc"
                className="mt-[var(--menu-space-0-5)] text-xs text-[var(--menu-text-muted)]"
              >
                {cart.reduce((s, i) => s + i.quantity, 0)}{" "}
                {cart.reduce((s, i) => s + i.quantity, 0) === 1
                  ? "vara"
                  : "varor"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Stäng varukorg"
              className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--menu-radius-pill)] border border-[var(--menu-border-control)] text-[color-mix(in_srgb,var(--menu-color-white)_60%,transparent)] transition hover:text-[var(--menu-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_srgb,var(--brand-copper)_70%,transparent)] active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-[var(--menu-space-3)] overflow-y-auto px-[var(--menu-space-5)] py-[var(--menu-space-4)]">
          {cart.length === 0 ? (
            <p className="py-[var(--menu-space-12)] text-center text-[var(--menu-text-muted)]">
              Din varukorg är tom
            </p>
          ) : (
            sortedCart.map((item) => (
              <div
                key={item.lineKey}
                className="rounded-[var(--menu-radius-card-lg)] border border-[var(--menu-border-soft)] bg-[var(--menu-color-page-muted)] p-[var(--menu-space-4)]"
              >
                <div className="flex items-start justify-between gap-[var(--menu-space-3)]">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[var(--menu-text-primary)]">{item.name}</h3>
                    {item.selectedOptions.length > 0 && (
                      <p className="mt-[var(--menu-space-1)] text-xs leading-relaxed text-[var(--menu-text-muted)]">
                        {item.selectedOptions
                          .map((o) =>
                            o.priceModifier > 0
                              ? `${o.name} (+${o.priceModifier} kr)`
                              : o.name
                          )
                          .join(" · ")}
                      </p>
                    )}
                    {item.note ? (
                      <p className="mt-[var(--menu-space-1)] text-xs italic text-[var(--menu-text-muted)]">
                        &ldquo;{item.note}&rdquo;
                      </p>
                    ) : null}
                    <p className="mt-[var(--menu-space-1)] text-sm text-[var(--brand-copper)]">
                      {item.price} kr / st
                    </p>
                  </div>
                  <p className="shrink-0 font-serif text-lg text-[var(--brand-cream)]">
                    {item.price * item.quantity} kr
                  </p>
                </div>

                <div className="mt-[var(--menu-space-4)] flex items-center justify-between">
                  <div className="flex items-center gap-[var(--menu-space-1)] rounded-[var(--menu-radius-md)] border border-[var(--menu-border-control)] bg-[var(--menu-color-surface-elevated)] p-[var(--menu-space-1)]">
                    <button
                      type="button"
                      onClick={() => onDecrease(item.lineKey)}
                      aria-label={`Minska antal ${item.name}`}
                      className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--menu-radius-sm)] text-[color-mix(in_srgb,var(--menu-color-white)_70%,transparent)] transition hover:bg-[var(--menu-control-glass-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_srgb,var(--brand-copper)_70%,transparent)] active:scale-95"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="min-w-[1.75rem] text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrease(item.lineKey)}
                      aria-label={`Öka antal ${item.name}`}
                      className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--menu-radius-sm)] bg-[var(--brand-copper)] text-[var(--menu-text-primary)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_srgb,var(--brand-copper)_70%,transparent)] active:scale-95"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(item.lineKey)}
                    className="inline-flex min-h-11 touch-manipulation items-center gap-[var(--menu-space-1-5)] rounded-[var(--menu-radius-pill)] px-[var(--menu-space-2)] text-xs text-[var(--menu-color-danger)] transition hover:text-[var(--menu-color-danger-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_srgb,var(--menu-color-danger)_70%,transparent)] active:scale-95"
                  >
                    <Trash2 size={14} />
                    Ta bort
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="menu-cart-drawer__footer shrink-0 border-t border-[var(--menu-border-soft)] bg-[var(--menu-color-page)] px-[var(--menu-space-5)] py-[var(--menu-space-4)] pb-[calc(var(--menu-space-4)+var(--menu-space-safe-bottom))]">
            <label className="mb-[var(--menu-space-4)] block">
              <span className="mb-[var(--menu-space-2)] block text-xs font-semibold uppercase tracking-wide text-[var(--menu-text-muted)]">
                Kommentar till beställningen
              </span>
              <textarea
                value={orderNote}
                onChange={(e) => onOrderNoteChange(e.target.value)}
                placeholder="Allergier, leveransinstruktioner eller andra önskemål…"
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-[var(--menu-radius-md)] border border-[var(--menu-border-control)] bg-[var(--menu-color-surface-strong)] px-[var(--menu-space-4)] py-[var(--menu-space-3)] text-sm text-[var(--menu-text-primary)] placeholder:text-[var(--menu-text-faint)] focus:border-[color-mix(in_srgb,var(--brand-copper)_50%,transparent)] focus:outline-none"
              />
              <span className="mt-[var(--menu-space-1)] block text-[11px] text-[var(--menu-text-faint)]">Valfritt</span>
            </label>

            <div className="mb-[var(--menu-space-4)] flex items-center justify-between">
              <span className="text-[var(--menu-text-secondary)]">Totalt</span>
              <span className="font-serif text-2xl text-[var(--brand-cream)]">
                {totalPrice} kr
              </span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="min-h-[3.25rem] w-full touch-manipulation rounded-[var(--menu-radius-card-lg)] bg-[var(--brand-copper)] py-[var(--menu-space-4)] text-base font-semibold text-[var(--menu-text-primary)] shadow-[var(--menu-shadow-accent-soft)] transition hover:bg-[var(--menu-color-primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_srgb,var(--brand-copper)_70%,transparent)] active:scale-[0.98]"
            >
              Gå till kassan — {totalPrice} kr
            </button>
          </div>
        )}
      </div>
    </>
  );
}
