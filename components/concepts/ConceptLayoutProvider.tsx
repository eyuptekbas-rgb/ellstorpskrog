"use client";

import { createContext, useContext, useMemo } from "react";
import {
  getConceptLayoutId,
  getConceptLayoutMeta,
  type ConceptLayoutId,
  type ConceptLayoutMeta,
} from "@/lib/tenant/concept-layouts";
import type { TenantTemplateId } from "@/lib/tenant/templates";

type ConceptLayoutContextValue = {
  templateId: TenantTemplateId;
  layoutId: ConceptLayoutId;
  meta: ConceptLayoutMeta;
};

const ConceptLayoutContext = createContext<ConceptLayoutContextValue | null>(
  null
);

export function ConceptLayoutProvider({
  templateId,
  children,
}: {
  templateId: TenantTemplateId;
  children: React.ReactNode;
}) {
  const value = useMemo(() => {
    const layoutId = getConceptLayoutId(templateId);
    return {
      templateId,
      layoutId,
      meta: getConceptLayoutMeta(layoutId),
    };
  }, [templateId]);

  return (
    <ConceptLayoutContext.Provider value={value}>
      {children}
    </ConceptLayoutContext.Provider>
  );
}

export function useConceptLayout() {
  const ctx = useContext(ConceptLayoutContext);
  if (!ctx) {
    throw new Error(
      "useConceptLayout must be used inside ConceptLayoutProvider"
    );
  }
  return ctx;
}

export function useConceptLayoutOptional() {
  return useContext(ConceptLayoutContext);
}
