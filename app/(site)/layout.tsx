import type { Metadata } from "next";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ReservationProvider from "@/components/ReservationProvider";
import ConsentProvider from "@/components/marketing/ConsentProvider";
import CookieConsentBanner from "@/components/marketing/CookieConsentBanner";
import MarketingScripts from "@/components/marketing/MarketingScripts";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import { buildMarketingPublicConfig } from "@/lib/marketing/config";
import { generateSiteMetadata } from "@/lib/seo/metadata";
import { ensureSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return generateSiteMetadata();
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await ensureSiteSettings();
  const marketingConfig = buildMarketingPublicConfig(settings);

  return (
    <ConsentProvider config={marketingConfig}>
      <MarketingScripts />
      <CookieConsentBanner />
      <ReservationProvider>
        <Header />
        <OfflineIndicator />
        <main className="site-main font-[var(--font-montserrat)]">
          {children}
        </main>
        <BottomNav />
        <InstallPrompt />
      </ReservationProvider>
    </ConsentProvider>
  );
}
