"use client";

import type { HomeSettings } from "@/app/(site)/HomeClient";
import { useConceptLayout } from "@/components/concepts/ConceptLayoutProvider";
import { renderConceptHome } from "@/components/concepts/home/ConceptHomeLayouts";

export default function ConceptHomeRouter(props: HomeSettings) {
  const { layoutId } = useConceptLayout();
  return renderConceptHome(layoutId, props);
}
