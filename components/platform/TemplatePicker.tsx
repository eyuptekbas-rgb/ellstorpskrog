"use client";

import { TENANT_TEMPLATES, type TenantTemplateId } from "@/lib/tenant/templates";
import { ORDINA } from "@/lib/tenant/branding";
import { Check } from "lucide-react";

type Props = {
  value: TenantTemplateId;
  onChange: (id: TenantTemplateId) => void;
  onPrimaryColorChange?: (color: string) => void;
  primaryColor?: string;
  showColorOverride?: boolean;
};

export default function TemplatePicker({
  value,
  onChange,
  primaryColor,
  onPrimaryColorChange,
  showColorOverride = true,
}: Props) {
  const selected = TENANT_TEMPLATES.find((t) => t.id === value);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
          Välj designkoncept (visuell stil)
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-[280px] overflow-y-auto pr-1">
          {TENANT_TEMPLATES.map((template) => {
            const active = value === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  onChange(template.id);
                  onPrimaryColorChange?.(template.defaultPrimary);
                }}
                className={`relative rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-[#7c3aed] ring-2 ring-[#7c3aed]/40"
                    : "border-white/10 hover:border-[#7c3aed]/30"
                }`}
                style={{ background: template.preview.background }}
              >
                {active && (
                  <span
                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-white"
                    style={{ background: ORDINA.primary }}
                  >
                    <Check size={12} />
                  </span>
                )}
                <div className="mb-2 flex gap-1">
                  {[template.preview.primary, template.preview.accent, template.preview.background].map(
                    (c, i) => (
                      <span
                        key={i}
                        className="h-4 w-4 rounded-full border border-white/20"
                        style={{ background: c }}
                      />
                    )
                  )}
                </div>
                <p className="text-xs font-semibold text-white">{template.name}</p>
                <p className="mt-0.5 text-[10px] font-medium text-[#a78bfa]">
                  {template.conceptLabel}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-white/45">
                  {template.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {showColorOverride && selected && onPrimaryColorChange && (
        <div>
          <label className="mb-1 block text-xs text-white/50">
            Primärfärg (valfri anpassning)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor ?? selected.defaultPrimary}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="h-11 w-16 cursor-pointer rounded-xl border border-[#7c3aed]/30 bg-[#0a0612]"
            />
            <button
              type="button"
              onClick={() => onPrimaryColorChange(selected.defaultPrimary)}
              className="text-xs text-[#a78bfa] hover:underline"
            >
              Återställ mallfärg
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
