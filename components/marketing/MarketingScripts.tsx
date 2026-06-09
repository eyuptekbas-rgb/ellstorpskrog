"use client";

import Script from "next/script";
import { useConsent } from "@/components/marketing/ConsentProvider";
import {
  hasAnalyticsConsent,
  hasMarketingConsent,
} from "@/lib/consent/types";

export default function MarketingScripts() {
  const { consent, config } = useConsent();

  if (!config.hasTracking || !consent) return null;

  const analyticsOk = hasAnalyticsConsent(consent);
  const marketingOk = hasMarketingConsent(consent);

  const loadGtm =
    config.googleTagManagerEnabled &&
    config.googleTagManagerId &&
    (analyticsOk || marketingOk);

  const loadGaDirect =
    analyticsOk &&
    config.googleAnalyticsEnabled &&
    config.googleAnalyticsId &&
    !loadGtm;

  const loadAds =
    marketingOk &&
    config.googleAdsEnabled &&
    config.googleAdsConversionId;

  const loadMeta =
    marketingOk && config.metaPixelEnabled && config.metaPixelId;

  const loadGtagLoader = loadGaDirect || loadAds;

  if (!loadGtm && !loadGtagLoader && !loadMeta) return null;

  const gtagPrimaryId =
    (loadGaDirect && config.googleAnalyticsId) ||
    (loadAds && config.googleAdsConversionId) ||
    "";

  return (
    <>
      {loadGtm && (
        <>
          <Script id="gtm-consent-init" strategy="afterInteractive">
            {`
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  'event': 'consent_default',
  'analytics_storage': '${analyticsOk ? "granted" : "denied"}',
  'ad_storage': '${marketingOk ? "granted" : "denied"}',
  'ad_user_data': '${marketingOk ? "granted" : "denied"}',
  'ad_personalization': '${marketingOk ? "granted" : "denied"}'
});
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${config.googleTagManagerId}');
`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${config.googleTagManagerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}

      {loadGtagLoader && gtagPrimaryId && (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gtagPrimaryId}`}
          strategy="afterInteractive"
        />
      )}

      {loadGtagLoader && (
        <Script id="gtag-marketing-init" strategy="afterInteractive">
          {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('consent', 'default', {
  'analytics_storage': '${analyticsOk ? "granted" : "denied"}',
  'ad_storage': '${marketingOk ? "granted" : "denied"}',
  'ad_user_data': '${marketingOk ? "granted" : "denied"}',
  'ad_personalization': '${marketingOk ? "granted" : "denied"}'
});
${loadGaDirect ? `gtag('config', '${config.googleAnalyticsId}', { anonymize_ip: true });` : ""}
${loadAds ? `gtag('config', '${config.googleAdsConversionId}');` : ""}
`}
        </Script>
      )}

      {loadMeta && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${config.metaPixelId}');
fbq('track', 'PageView');
`}
        </Script>
      )}
    </>
  );
}
