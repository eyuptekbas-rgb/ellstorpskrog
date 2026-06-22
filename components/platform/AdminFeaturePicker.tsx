"use client";

import {
  ADMIN_FEATURE_IDS,
  ADMIN_FEATURE_LABELS,
  defaultAdminFeatures,
  type AdminFeatureId,
  type AdminFeatures,
} from "@/lib/tenant/admin-features";

type Props = {
  value: AdminFeatures;
  onChange: (features: AdminFeatures) => void;
  disabled?: boolean;
};

const GROUP_LABELS = {
  overview: "Översikt",
  catalog: "Meny",
  system: "System",
} as const;

export default function AdminFeaturePicker({ value, onChange, disabled }: Props) {
  const groups = {
    overview: ADMIN_FEATURE_IDS.filter(
      (id) => ADMIN_FEATURE_LABELS[id].group === "overview"
    ),
    catalog: ADMIN_FEATURE_IDS.filter(
      (id) => ADMIN_FEATURE_LABELS[id].group === "catalog"
    ),
    system: ADMIN_FEATURE_IDS.filter(
      (id) => ADMIN_FEATURE_LABELS[id].group === "system"
    ),
  };

  const toggle = (id: AdminFeatureId) => {
    if (disabled) return;
    onChange({ ...value, [id]: !value[id] });
  };

  const setAll = (enabled: boolean) => {
    if (disabled) return;
    onChange(
      Object.fromEntries(ADMIN_FEATURE_IDS.map((id) => [id, enabled])) as AdminFeatures
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setAll(true)}
          className="rounded-lg border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-3 py-1.5 text-xs font-medium text-[#c4b5fd] disabled:opacity-50"
        >
          Aktivera alla
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setAll(false)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 disabled:opacity-50"
        >
          Inaktivera alla
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(defaultAdminFeatures())}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 disabled:opacity-50"
        >
          Standard
        </button>
      </div>

      {(Object.keys(groups) as Array<keyof typeof groups>).map((groupKey) => (
        <div key={groupKey}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/35">
            {GROUP_LABELS[groupKey]}
          </p>
          <div className="space-y-2">
            {groups[groupKey].map((id) => {
              const meta = ADMIN_FEATURE_LABELS[id];
              const checked = value[id];
              return (
                <label
                  key={id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    checked
                      ? "border-[#7c3aed]/35 bg-[#7c3aed]/8"
                      : "border-white/8 bg-white/[0.02]"
                  } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(id)}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 accent-[#7c3aed]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-white/90">
                      {meta.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-white/40">
                      {meta.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
