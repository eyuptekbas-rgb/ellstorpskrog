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

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const CategoryNav = forwardRef<HTMLElement, Props>(function CategoryNav(
  { categories, activeCategoryId, onSelect, onQuickJump },
  ref
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const activeCategoryIdRef = useRef(activeCategoryId);

  useEffect(() => {
    activeCategoryIdRef.current = activeCategoryId;
  }, [activeCategoryId]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const pads = Array.from(
      track.querySelectorAll<HTMLElement>(".menu-category-nav__track-pad")
    );

    const syncTrackPads = () => {
      const half = track.clientWidth / 2;
      for (const pad of pads) {
        pad.style.width = `${half}px`;
      }
    };

    syncTrackPads();
    const resizeObserver = new ResizeObserver(syncTrackPads);
    resizeObserver.observe(track);

    let alive = true;
    let rafId = 0;

    const centerActiveChip = () => {
      if (!alive) return;

      const active = track.querySelector<HTMLElement>(
        `[data-category-id="${activeCategoryIdRef.current}"]`
      );
      if (active) {
        const indicator = indicatorRef.current;
        if (indicator) {
          indicator.style.width = `${active.offsetWidth}px`;
          indicator.style.transform = `translate3d(${active.offsetLeft}px, -50%, 0)`;
        }

        const trackRect = track.getBoundingClientRect();
        const btnRect = active.getBoundingClientRect();
        const targetLeft =
          track.scrollLeft +
          (btnRect.left - trackRect.left - trackRect.width / 2 + btnRect.width / 2);
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        const clamped = Math.min(Math.max(0, targetLeft), maxScroll);
        const delta = clamped - track.scrollLeft;

        if (Math.abs(delta) < 0.5) {
          track.scrollLeft = clamped;
        } else if (prefersReducedMotion()) {
          track.scrollLeft = clamped;
        } else {
          track.scrollLeft += delta * 0.24;
        }
      }

      rafId = window.requestAnimationFrame(centerActiveChip);
    };

    rafId = window.requestAnimationFrame(centerActiveChip);

    return () => {
      alive = false;
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [categories]);

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
          <span
            ref={indicatorRef}
            className="menu-category-nav__indicator"
            aria-hidden
          />
          <span className="menu-category-nav__track-pad" aria-hidden />
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
          <span className="menu-category-nav__track-pad" aria-hidden />
        </div>
      </div>
    </nav>
  );
});

export default CategoryNav;
