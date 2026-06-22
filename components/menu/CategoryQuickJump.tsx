"use client";

import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { getCategoryCountLabel, getCategoryEmoji } from "@/lib/menu/constants";
import type { MenuCategory } from "@/lib/menu";

/**
 * Menu V3 — Quick Jump bottom sheet.
 *
 * Shows every category at once (icon + name + count). One tap scrolls to the
 * category and closes. No nesting, no collapsing — a single flat overview.
 *
 * Accessibility follows the same WAI-ARIA dialog pattern used by CartDrawer /
 * ProductCustomizeSheet: role="dialog", aria-modal, focus trap, initial focus,
 * focus restore, Escape to close, body scroll lock, and background inertness.
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
  categories: MenuCategory[];
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
};

export default function CategoryQuickJump({
  open,
  categories,
  activeCategoryId,
  onSelect,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Scroll lock · background inert · initial + restore focus.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const parent = dialog.parentElement;
    const siblings: Element[] = parent
      ? Array.from(parent.children).filter((child) => child !== dialog)
      : [];
    const inerted: Element[] = [];
    const hiddenFromAt: Element[] = [];

    if (open) {
      openerRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      dialog.removeAttribute("inert");
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
      const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
      focusable[0]?.focus();
    } else {
      dialog.setAttribute("inert", "");
    }

    return () => {
      document.body.style.overflow = "";
      inerted.forEach((el) => el.removeAttribute("inert"));
      hiddenFromAt.forEach((el) => el.removeAttribute("aria-hidden"));
      if (open) {
        openerRef.current?.focus();
        openerRef.current = null;
      }
    };
  }, [open]);

  // Escape closes.
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

  // Focus trap.
  const trapFocus = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
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
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const handleSelect = (categoryId: string) => {
    onSelect(categoryId);
    onClose();
  };

  return (
    <>
      {open && (
        <div
          className="menu-quickjump-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        ref={dialogRef}
        className={`menu-quickjump${open ? " menu-quickjump--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickjump-title"
        onKeyDown={trapFocus}
      >
        <div className="menu-quickjump__handle" aria-hidden="true" />

        <div className="menu-quickjump__head">
          <h2 id="quickjump-title" className="menu-quickjump__title">
            Hoppa till kategori
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stäng"
            className="menu-quickjump__close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="menu-quickjump__grid">
          {categories.map((category) => {
            const isActive = category.id === activeCategoryId;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleSelect(category.id)}
                aria-current={isActive ? "true" : undefined}
                className={`menu-quickjump__tile${
                  isActive ? " menu-quickjump__tile--active" : ""
                }`}
              >
                <span className="menu-quickjump__tile-emoji" aria-hidden="true">
                  {getCategoryEmoji(category.slug)}
                </span>
                <span className="menu-quickjump__tile-text">
                  <span className="menu-quickjump__tile-name">
                    {category.name}
                  </span>
                  <span className="menu-quickjump__tile-count">
                    {getCategoryCountLabel(category.slug, category.products.length)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
