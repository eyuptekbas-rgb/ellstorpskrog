"use client";

import Link from "next/link";
import PhoneMockup from "@/components/platform/PhoneMockup";
import DesignPreviewFrame from "@/components/platform/DesignPreviewFrame";
import {
  CONCEPT_LAYOUTS,
  TEMPLATE_LAYOUT_MAP,
} from "@/lib/tenant/concept-layouts";
import { TENANT_TEMPLATES, type TenantTemplateId } from "@/lib/tenant/templates";

const PREVIEW_PAGES = ["home", "menu", "kontakt", "booking"] as const;
const PAGE_LABELS: Record<(typeof PREVIEW_PAGES)[number], string> = {
  home: "Hem",
  menu: "Meny",
  kontakt: "Kontakt",
  booking: "Bokning",
};

export default function DesignConceptGallery() {
  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-[#7c3aed]/20 bg-[#120a1f] p-6">
        <h2 className="text-lg font-semibold text-white">Så fungerar det</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Alla 10 koncept kör <strong className="text-white/80">samma Ellstorps-app</strong> —
          samma routes, varukorg, bokning, backend och affärslogik. Varje koncept har
          en <strong className="text-white/80">egen mobil layout</strong>: navigation,
          hero, sektionsordning, menystruktur och kontaktsida.
        </p>
        <p className="mt-2 text-sm text-[#a78bfa]">
          Välj koncept per kund under{" "}
          <Link href="/platform/tenants" className="underline">
            Kunder → Mall
          </Link>
          , eller förhandsgranska via{" "}
          <code className="rounded bg-white/10 px-1">/r/[slug]</code>.
        </p>
      </div>

      <div className="grid gap-8">
        {TENANT_TEMPLATES.map((template) => {
          const layoutId = TEMPLATE_LAYOUT_MAP[template.id as TenantTemplateId];
          const layoutMeta = CONCEPT_LAYOUTS.find((l) => l.id === layoutId)!;

          return (
            <article
              key={template.id}
              className="rounded-2xl border border-[#7c3aed]/15 bg-[#120a1f] p-6"
            >
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#7c3aed]">
                    Koncept {layoutMeta.index} · {layoutMeta.name}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    {template.conceptLabel}
                  </h3>
                  <p className="mt-1 text-sm text-white/45">{layoutMeta.tagline}</p>
                  <p className="mt-1 text-xs text-white/30">
                    Mall-ID: <code className="text-white/45">{template.id}</code>
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {[template.preview.primary, template.preview.accent, template.preview.background].map(
                    (c, i) => (
                      <span
                        key={i}
                        className="h-8 w-8 rounded-lg border border-white/15"
                        style={{ background: c }}
                        title="Färgtema (sekundärt till layout)"
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
                {PREVIEW_PAGES.map((page) => (
                  <PhoneMockup key={page} label={PAGE_LABELS[page]}>
                    <DesignPreviewFrame
                      templateId={template.id as TenantTemplateId}
                      page={page}
                    />
                  </PhoneMockup>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
