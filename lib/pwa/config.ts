/** Ellstorps Krog PWA branding — shared across manifest, meta tags, and native wrappers. */
export const PWA = {
  name: "Ellstorps Krog",
  shortName: "Ellstorps",
  description:
    "Beställ mat online, se menyn och kontakta Ellstorps Krog i Malmö.",
  themeColor: "#b85c38",
  backgroundColor: "#0f0f0f",
  display: "standalone" as const,
  orientation: "portrait" as const,
  startUrl: "/",
  scope: "/",
  lang: "sv",
  categories: ["food", "restaurants", "shopping"],
  id: "/",
} as const;

export const OFFLINE_PAGES = ["/", "/menu", "/kontakt"] as const;

export const SPLASH_SCREENS = [
  {
    media:
      "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
    href: "/splash/iphone-14.png",
  },
  {
    media:
      "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
    href: "/splash/iphone-14-pro-max.png",
  },
  {
    media:
      "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
    href: "/splash/iphone-se.png",
  },
  {
    media:
      "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
    href: "/splash/ipad.png",
  },
] as const;

export const NATIVE_WRAPPER = {
  /** Android TWA — update with your Play Store signing certificate SHA-256 */
  androidPackage: "se.ellstorpskrog.app",
  /** iOS bundle identifier for Capacitor / App Store wrapper */
  iosBundleId: "se.ellstorpskrog.app",
  /** Deep link scheme for wrapped native apps */
  urlScheme: "ellstorpskrog",
} as const;
