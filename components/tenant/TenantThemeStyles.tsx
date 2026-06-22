import type { ResolvedTenantTheme } from "@/lib/tenant/templates";

type Props = {
  theme: ResolvedTenantTheme;
};

export default function TenantThemeStyles({ theme }: Props) {
  const rules = Object.entries(theme.cssVars)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root { ${rules} } [data-template="${theme.templateId}"] { ${rules} }`,
      }}
    />
  );
}
