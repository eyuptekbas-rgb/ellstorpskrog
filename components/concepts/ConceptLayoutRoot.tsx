"use client";

import { ConceptLayoutProvider } from "@/components/concepts/ConceptLayoutProvider";
import type { TenantTemplateId } from "@/lib/tenant/templates";

export default function ConceptLayoutRoot({
  templateId,
  children,
}: {
  templateId: TenantTemplateId;
  children: React.ReactNode;
}) {
  return (
    <ConceptLayoutProvider templateId={templateId}>
      {children}
    </ConceptLayoutProvider>
  );
}
