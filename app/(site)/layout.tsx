import type { Metadata } from "next";
import Header from "@/components/Header";
import ConceptLayoutRoot from "@/components/concepts/ConceptLayoutRoot";
import ConceptBottomNav from "@/components/concepts/nav/ConceptBottomNav";
import { getConceptLayoutId } from "@/lib/tenant/concept-layouts";
import ReservationProvider from "@/components/ReservationProvider";
import ConsentProvider from "@/components/marketing/ConsentProvider";
import CookieConsentBanner from "@/components/marketing/CookieConsentBanner";
import MarketingScripts from "@/components/marketing/MarketingScripts";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import TenantThemeStyles from "@/components/tenant/TenantThemeStyles";
import { TenantBrandingProvider } from "@/components/tenant/TenantBrandingProvider";
import { TenantPublicPathProvider } from "@/components/tenant/TenantPublicPathProvider";
import { buildMarketingPublicConfig } from "@/lib/marketing/config";
import { generateSiteMetadata } from "@/lib/seo/metadata";
import { ensureSiteSettings } from "@/lib/settings";
import TenantSuspendedPage from "@/components/tenant/TenantSuspendedPage";
import { DEFAULT_TENANT_SLUG, getTenantById, resolvePublicTenantId, resolveRequestedPublicTenant } from "@/lib/tenant/resolve";
import { resolveTenantTheme } from "@/lib/tenant/templates";

export async function generateMetadata(): Promise<Metadata> {
  return generateSiteMetadata();
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestedTenant = await resolveRequestedPublicTenant();
  if (requestedTenant && !requestedTenant.active) {
    return (
      <>
        <TenantThemeStyles theme={resolveTenantTheme(requestedTenant.templateId, requestedTenant.primaryColor)} />
        <main
          className="site-main min-h-screen"
          style={{
            fontFamily: "var(--font-body, var(--font-montserrat))",
            color: "var(--foreground)",
            background: "var(--background)",
          }}
        >
          <TenantSuspendedPage restaurantName={requestedTenant.name} />
        </main>
      </>
    );
  }

  const tenantId = await resolvePublicTenantId();
  const [settings, tenant] = await Promise.all([
    ensureSiteSettings(tenantId),
    getTenantById(tenantId),
  ]);
  const templateId = tenant?.templateId ?? "dark-copper-premium";
  const theme = resolveTenantTheme(templateId, tenant?.primaryColor);
  const conceptLayoutId = getConceptLayoutId(templateId);
  const marketingConfig = buildMarketingPublicConfig(settings);
  const defaultSlug = process.env.DEFAULT_TENANT_SLUG ?? DEFAULT_TENANT_SLUG;
  const branding = {
    slug: tenant?.slug ?? defaultSlug,
    restaurantName: settings.restaurantName,
    logo: settings.logo,
    isDefaultTenant: (tenant?.slug ?? defaultSlug) === defaultSlug,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    facebookUrl: settings.facebookUrl,
    instagramUrl: settings.instagramUrl,
  };

  return (
    <>
      <TenantThemeStyles theme={theme} />
      <div data-template={theme.templateId} data-concept-layout={conceptLayoutId}>
        <ConsentProvider config={marketingConfig}>
          <MarketingScripts />
          <CookieConsentBanner />
          <TenantBrandingProvider branding={branding}>
            <ConceptLayoutRoot templateId={theme.templateId}>
              <ReservationProvider>
                <TenantPublicPathProvider>
                  <Header />
                  <OfflineIndicator />
                  <main
                    className="site-main"
                    style={{
                      fontFamily: "var(--font-body, var(--font-montserrat))",
                      color: "var(--foreground)",
                      background: "var(--background)",
                    }}
                  >
                    {children}
                  </main>
                  <ConceptBottomNav />
                </TenantPublicPathProvider>
              </ReservationProvider>
            </ConceptLayoutRoot>
          </TenantBrandingProvider>
        </ConsentProvider>
      </div>
    </>
  );
}
