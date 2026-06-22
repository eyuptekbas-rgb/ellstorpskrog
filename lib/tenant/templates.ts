export type TenantTemplateId =
  | "premium-scandinavian"
  | "luxury-steakhouse"
  | "modern-nordic-bistro"
  | "dark-copper-premium"
  | "italian-trattoria"
  | "minimal-black-white"
  | "elegant-fine-dining"
  | "modern-food-delivery"
  | "rustic-gastro-pub"
  | "premium-app-store";

export type TenantTemplateVars = {
  background: string;
  foreground: string;
  brandCopper: string;
  brandCopperDark: string;
  brandCopperLight: string;
  brandGold: string;
  brandCream: string;
  brandSurface: string;
  brandElevated: string;
  radiusCard: string;
  radiusBtn: string;
  fontDisplay: string;
  fontBody: string;
  heroGradient: string;
  cardShadow: string;
  sectionPy: string;
};

export type TenantTemplate = {
  id: TenantTemplateId;
  name: string;
  conceptLabel: string;
  description: string;
  preview: { primary: string; background: string; accent: string };
  defaultPrimary: string;
  vars: TenantTemplateVars;
};

export const TENANT_TEMPLATES: TenantTemplate[] = [
  {
    id: "premium-scandinavian",
    name: "Premium Scandinavian",
    conceptLabel: "Premium Scandinavian",
    description: "Ljust, luftigt och nordiskt — mjuka neutrala toner med diskret accent",
    preview: { primary: "#5b7c8a", background: "#f4f1ec", accent: "#8fa9b5" },
    defaultPrimary: "#5b7c8a",
    vars: {
      background: "#f4f1ec",
      foreground: "#1a1f24",
      brandCopper: "#5b7c8a",
      brandCopperDark: "#3f5a66",
      brandCopperLight: "#7a96a3",
      brandGold: "#8fa9b5",
      brandCream: "#e8e2d9",
      brandSurface: "#ffffff",
      brandElevated: "#faf8f5",
      radiusCard: "1.25rem",
      radiusBtn: "9999px",
      fontDisplay: "var(--font-playfair), Georgia, serif",
      fontBody: "var(--font-montserrat), system-ui, sans-serif",
      heroGradient: "linear-gradient(180deg, rgba(26,31,36,0.55) 0%, rgba(244,241,236,0.95) 100%)",
      cardShadow: "0 8px 32px rgba(26,31,36,0.08)",
      sectionPy: "3.5rem",
    },
  },
  {
    id: "luxury-steakhouse",
    name: "Luxury Steakhouse",
    conceptLabel: "Luxury Steakhouse",
    description: "Mörk lyx med guldaccenter — steakhouse och fine meat",
    preview: { primary: "#c9a227", background: "#080808", accent: "#f0d78c" },
    defaultPrimary: "#c9a227",
    vars: {
      background: "#080808",
      foreground: "#faf6ee",
      brandCopper: "#c9a227",
      brandCopperDark: "#9a7b1a",
      brandCopperLight: "#dbb83a",
      brandGold: "#f0d78c",
      brandCream: "#f5ecd4",
      brandSurface: "#111111",
      brandElevated: "#1c1a14",
      radiusCard: "0.5rem",
      radiusBtn: "0.25rem",
      fontDisplay: "var(--font-playfair), Georgia, serif",
      fontBody: "var(--font-montserrat), system-ui, sans-serif",
      heroGradient: "linear-gradient(180deg, rgba(8,8,8,0.2) 0%, rgba(8,8,8,0.92) 100%)",
      cardShadow: "0 12px 40px rgba(0,0,0,0.6)",
      sectionPy: "4rem",
    },
  },
  {
    id: "modern-nordic-bistro",
    name: "Modern Nordic Bistro",
    conceptLabel: "Modern Nordic Bistro",
    description: "Skogsgrönt och naturligt — modern bistro med nordisk känsla",
    preview: { primary: "#3d6b4f", background: "#0a120e", accent: "#8fbc8f" },
    defaultPrimary: "#3d6b4f",
    vars: {
      background: "#0a120e",
      foreground: "#eef4ef",
      brandCopper: "#3d6b4f",
      brandCopperDark: "#2d5040",
      brandCopperLight: "#4d8260",
      brandGold: "#8fbc8f",
      brandCream: "#c8dcc8",
      brandSurface: "#111a14",
      brandElevated: "#162018",
      radiusCard: "1rem",
      radiusBtn: "9999px",
      fontDisplay: "var(--font-montserrat), system-ui, sans-serif",
      fontBody: "var(--font-montserrat), system-ui, sans-serif",
      heroGradient: "linear-gradient(180deg, rgba(10,18,14,0.35) 0%, rgba(10,18,14,0.94) 100%)",
      cardShadow: "0 6px 24px rgba(0,0,0,0.35)",
      sectionPy: "3rem",
    },
  },
  {
    id: "dark-copper-premium",
    name: "Dark Copper Premium",
    conceptLabel: "Dark Copper Premium",
    description: "Ellstorps Krog — varm koppar på mörk bakgrund",
    preview: { primary: "#b85c38", background: "#0f0f0f", accent: "#d4a574" },
    defaultPrimary: "#b85c38",
    vars: {
      background: "#0f0f0f",
      foreground: "#f5f0eb",
      brandCopper: "#b85c38",
      brandCopperDark: "#8f4528",
      brandCopperLight: "#c96a44",
      brandGold: "#d4a574",
      brandCream: "#e8c4a8",
      brandSurface: "#141414",
      brandElevated: "#1a1a1a",
      radiusCard: "1.75rem",
      radiusBtn: "9999px",
      fontDisplay: "var(--font-playfair), Georgia, serif",
      fontBody: "var(--font-montserrat), system-ui, sans-serif",
      heroGradient: "linear-gradient(180deg, rgba(15,15,15,0.35) 0%, rgba(15,15,15,0.95) 100%)",
      cardShadow: "0 10px 36px rgba(0,0,0,0.45)",
      sectionPy: "3.5rem",
    },
  },
  {
    id: "italian-trattoria",
    name: "Italian Trattoria",
    conceptLabel: "Italian Trattoria",
    description: "Italiensk värme — rött, cream och terracotta",
    preview: { primary: "#c53030", background: "#100808", accent: "#fc8181" },
    defaultPrimary: "#c53030",
    vars: {
      background: "#100808",
      foreground: "#fef2f2",
      brandCopper: "#c53030",
      brandCopperDark: "#9b2c2c",
      brandCopperLight: "#e05252",
      brandGold: "#fc8181",
      brandCream: "#fed7d7",
      brandSurface: "#1a0e0e",
      brandElevated: "#221212",
      radiusCard: "1rem",
      radiusBtn: "9999px",
      fontDisplay: "var(--font-playfair), Georgia, serif",
      fontBody: "var(--font-montserrat), system-ui, sans-serif",
      heroGradient: "linear-gradient(180deg, rgba(16,8,8,0.3) 0%, rgba(16,8,8,0.94) 100%)",
      cardShadow: "0 8px 28px rgba(197,48,48,0.15)",
      sectionPy: "3rem",
    },
  },
  {
    id: "minimal-black-white",
    name: "Minimal Black & White",
    conceptLabel: "Minimal Black & White",
    description: "Strikt monokrom — typografi och whitespace i fokus",
    preview: { primary: "#a0aec0", background: "#0a0a0a", accent: "#e2e8f0" },
    defaultPrimary: "#a0aec0",
    vars: {
      background: "#0a0a0a",
      foreground: "#f7fafc",
      brandCopper: "#a0aec0",
      brandCopperDark: "#718096",
      brandCopperLight: "#cbd5e0",
      brandGold: "#e2e8f0",
      brandCream: "#edf2f7",
      brandSurface: "#111111",
      brandElevated: "#1a1a1a",
      radiusCard: "0.25rem",
      radiusBtn: "0.125rem",
      fontDisplay: "'Helvetica Neue', Arial, sans-serif",
      fontBody: "var(--font-montserrat), system-ui, sans-serif",
      heroGradient: "linear-gradient(180deg, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.98) 100%)",
      cardShadow: "none",
      sectionPy: "4.5rem",
    },
  },
  {
    id: "elegant-fine-dining",
    name: "Elegant Fine Dining",
    conceptLabel: "Elegant Fine Dining",
    description: "Exklusiv fine dining — champagne, svart och guld",
    preview: { primary: "#d4af37", background: "#050505", accent: "#f5e6b8" },
    defaultPrimary: "#d4af37",
    vars: {
      background: "#050505",
      foreground: "#faf8f2",
      brandCopper: "#d4af37",
      brandCopperDark: "#a68a2a",
      brandCopperLight: "#e8c85a",
      brandGold: "#f5e6b8",
      brandCream: "#f0e4c8",
      brandSurface: "#0c0c0c",
      brandElevated: "#141414",
      radiusCard: "0.375rem",
      radiusBtn: "0.25rem",
      fontDisplay: "var(--font-playfair), Georgia, serif",
      fontBody: "var(--font-montserrat), system-ui, sans-serif",
      heroGradient: "linear-gradient(180deg, rgba(5,5,5,0.25) 0%, rgba(5,5,5,0.96) 100%)",
      cardShadow: "0 16px 48px rgba(0,0,0,0.55)",
      sectionPy: "5rem",
    },
  },
  {
    id: "modern-food-delivery",
    name: "Modern Food Delivery",
    conceptLabel: "Modern Food Delivery",
    description: "App-liknande delivery — neonaccenter, tydliga CTA",
    preview: { primary: "#00e5a0", background: "#050508", accent: "#00ffcc" },
    defaultPrimary: "#00e5a0",
    vars: {
      background: "#050508",
      foreground: "#f0fff8",
      brandCopper: "#00e5a0",
      brandCopperDark: "#00b37a",
      brandCopperLight: "#33ebb3",
      brandGold: "#00ffcc",
      brandCream: "#b2f5ea",
      brandSurface: "#0c0c12",
      brandElevated: "#12121a",
      radiusCard: "0.875rem",
      radiusBtn: "0.75rem",
      fontDisplay: "system-ui, -apple-system, sans-serif",
      fontBody: "system-ui, -apple-system, sans-serif",
      heroGradient: "linear-gradient(180deg, rgba(5,5,8,0.5) 0%, rgba(5,5,8,0.96) 100%)",
      cardShadow: "0 4px 20px rgba(0,229,160,0.12)",
      sectionPy: "2.5rem",
    },
  },
  {
    id: "rustic-gastro-pub",
    name: "Rustic Gastro Pub",
    conceptLabel: "Rustic Gastro Pub",
    description: "Rustik pub — varma orange och trätoner",
    preview: { primary: "#dd6b20", background: "#0f0a06", accent: "#f6ad55" },
    defaultPrimary: "#dd6b20",
    vars: {
      background: "#0f0a06",
      foreground: "#fffaf0",
      brandCopper: "#dd6b20",
      brandCopperDark: "#c05621",
      brandCopperLight: "#ed8936",
      brandGold: "#f6ad55",
      brandCream: "#feebc8",
      brandSurface: "#1a1208",
      brandElevated: "#221808",
      radiusCard: "0.75rem",
      radiusBtn: "0.5rem",
      fontDisplay: "var(--font-playfair), Georgia, serif",
      fontBody: "var(--font-montserrat), system-ui, sans-serif",
      heroGradient: "linear-gradient(180deg, rgba(15,10,6,0.4) 0%, rgba(15,10,6,0.94) 100%)",
      cardShadow: "0 6px 20px rgba(0,0,0,0.4)",
      sectionPy: "3rem",
    },
  },
  {
    id: "premium-app-store",
    name: "Premium App Store Style",
    conceptLabel: "Premium App Store Style",
    description: "iOS App Store-känsla — lila premium, mjuka kort",
    preview: { primary: "#805ad5", background: "#0c0a12", accent: "#b794f4" },
    defaultPrimary: "#805ad5",
    vars: {
      background: "#0c0a12",
      foreground: "#f7f5ff",
      brandCopper: "#805ad5",
      brandCopperDark: "#6b46c1",
      brandCopperLight: "#9f7aea",
      brandGold: "#b794f4",
      brandCream: "#e9d8fd",
      brandSurface: "#14101c",
      brandElevated: "#1a1524",
      radiusCard: "1.25rem",
      radiusBtn: "9999px",
      fontDisplay: "system-ui, -apple-system, sans-serif",
      fontBody: "var(--font-montserrat), system-ui, sans-serif",
      heroGradient: "linear-gradient(180deg, rgba(12,10,18,0.35) 0%, rgba(12,10,18,0.95) 100%)",
      cardShadow: "0 8px 32px rgba(128,90,213,0.18)",
      sectionPy: "3rem",
    },
  },
];

export const DEFAULT_TEMPLATE_ID: TenantTemplateId = "dark-copper-premium";

const templateMap = new Map(TENANT_TEMPLATES.map((t) => [t.id, t]));

/** Maps deprecated layout-based template IDs to visual concepts */
export const LEGACY_TEMPLATE_MAP: Record<string, TenantTemplateId> = {
  "copper-classic": "dark-copper-premium",
  "midnight-gold": "luxury-steakhouse",
  "forest-green": "modern-nordic-bistro",
  "ocean-blue": "premium-scandinavian",
  "ruby-red": "italian-trattoria",
  "sunset-orange": "rustic-gastro-pub",
  "lavender-bistro": "premium-app-store",
  "monochrome": "minimal-black-white",
  "terracotta": "elegant-fine-dining",
  "neon-street": "modern-food-delivery",
};

export function migrateTemplateId(id: string | null | undefined): TenantTemplateId {
  if (!id) return DEFAULT_TEMPLATE_ID;
  if (isValidTemplateId(id)) return id;
  return LEGACY_TEMPLATE_MAP[id] ?? DEFAULT_TEMPLATE_ID;
}

export function getTemplate(id: string | null | undefined): TenantTemplate {
  return templateMap.get(migrateTemplateId(id)) ?? templateMap.get(DEFAULT_TEMPLATE_ID)!;
}

export function isValidTemplateId(id: string): id is TenantTemplateId {
  return templateMap.has(id as TenantTemplateId);
}

function shade(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const r = Math.min(255, Math.max(0, parseInt(n.slice(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(n.slice(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(n.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export type ResolvedTenantTheme = {
  templateId: TenantTemplateId;
  templateName: string;
  conceptLabel: string;
  cssVars: Record<string, string>;
};

export function resolveTenantTheme(
  templateId: string | null | undefined,
  primaryColorOverride?: string | null
): ResolvedTenantTheme {
  const template = getTemplate(templateId);
  const primary = primaryColorOverride?.trim() || template.defaultPrimary;

  const vars = {
    ...template.vars,
    brandCopper: primary,
    brandCopperDark: shade(primary, -35),
    brandCopperLight: shade(primary, 25),
  };

  return {
    templateId: template.id,
    templateName: template.name,
    conceptLabel: template.conceptLabel,
    cssVars: {
      "--background": vars.background,
      "--foreground": vars.foreground,
      "--brand-copper": vars.brandCopper,
      "--brand-copper-dark": vars.brandCopperDark,
      "--brand-copper-light": vars.brandCopperLight,
      "--brand-gold": vars.brandGold,
      "--brand-cream": vars.brandCream,
      "--brand-surface": vars.brandSurface,
      "--brand-elevated": vars.brandElevated,
      "--radius-card": vars.radiusCard,
      "--radius-btn": vars.radiusBtn,
      "--font-display": vars.fontDisplay,
      "--font-body": vars.fontBody,
      "--hero-gradient": vars.heroGradient,
      "--card-shadow": vars.cardShadow,
      "--section-py": vars.sectionPy,
    },
  };
}
