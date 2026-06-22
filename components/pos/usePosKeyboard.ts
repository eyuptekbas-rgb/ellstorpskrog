"use client";

import { useEffect } from "react";
import type { OrderFilterGroup } from "@/lib/orders/admin-filters";
import { POS_FILTER_SHORTCUTS } from "@/lib/pos/filters";

type Options = {
  onFilterChange: (filter: OrderFilterGroup) => void;
  onCloseDrawer: () => void;
  drawerOpen: boolean;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function usePosKeyboard({
  onFilterChange,
  onCloseDrawer,
  drawerOpen,
}: Options) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      if (event.key === "Escape") {
        if (drawerOpen) {
          event.preventDefault();
          onCloseDrawer();
        }
        return;
      }

      const filter = POS_FILTER_SHORTCUTS[event.key];
      if (filter) {
        event.preventDefault();
        onFilterChange(filter);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onFilterChange, onCloseDrawer, drawerOpen]);
}
