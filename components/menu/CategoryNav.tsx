"use client";

import { forwardRef, useEffect, useRef } from "react";
import { LayoutGrid } from "lucide-react";
import { getCategoryEmoji } from "@/lib/menu/constants";
import type { MenuCategory } from "@/lib/menu";

type Props = {
  categories: MenuCategory[];
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
  onQuickJump: () => void;
};

const CategoryNav = forwardRef<HTMLElement, Props>(function CategoryNav(
  { categories, activeCategoryId, onSelect, onQuickJump },
  ref
) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const active = track.querySelector<HTMLElement>(
      `[data-category-id="${activeCategoryId}"]`
    );
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeCategoryId, categories]);

  /*
   * Accessibility: semantic in-page navigation (not tabs).
   * All category sections stay in the DOM; aria-current marks the visible one.
   */
  return (
    <nav
      ref={ref}
      className="menu-category-nav sticky top-[var(--header-height-mobile)] z-[var(--menu-z-category-nav)] lg:top-[var(--header-height)]"
      aria-label="Kategorier"
    >
      <div className="menu-category-nav__inner">
        <button
          type="button"
          onClick={onQuickJump}
          className="menu-category-nav__jump"
          aria-label="Visa alla kategorier"
          aria-haspopup="dialog"
        >
          <LayoutGrid size={18} strokeWidth={2.25} aria-hidden />
        </button>

        <div ref={trackRef} className="menu-category-nav__track">
          {categories.map((category) => {
          const isActive = activeCategoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              data-category-id={category.id}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onSelect(category.id)}
              className={`menu-category-nav__pill${isActive ? " menu-category-nav__pill--active" : ""}`}
            >
              <span className="menu-category-nav__emoji" aria-hidden="true">
                {getCategoryEmoji(category.slug)}
              </span>
              {category.name}
            </button>
          );
          })}
        </div>
      </div>
    </nav>
  );
});

export default CategoryNav;
