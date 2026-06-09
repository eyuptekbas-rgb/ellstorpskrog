import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import withPWAInit from "@ducanh2912/next-pwa";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const pwaOptions = {
  dest: "public",
  register: true,
  skipWaiting: true,
  scope: "/",
  sw: "sw.js",
  reloadOnOnline: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    navigateFallback: "/offline",
    navigateFallbackDenylist: [/^\/admin/, /^\/api/, /^\/checkout/],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff2?)$/i,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/manifest\.webmanifest$/,
        handler: "StaleWhileRevalidate" as const,
        options: {
          cacheName: "manifest",
          expiration: { maxEntries: 1, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/api\/settings\/public$/,
        handler: "StaleWhileRevalidate" as const,
        options: {
          cacheName: "settings-api",
          expiration: { maxEntries: 1, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^\/(?:menu|kontakt)?\/?$/,
        handler: "NetworkFirst" as const,
        options: {
          cacheName: "offline-pages",
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\/offline$/,
        handler: "CacheFirst" as const,
        options: {
          cacheName: "offline-fallback",
          expiration: { maxEntries: 1, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
    ],
  },
};

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
    {
      source: "/manifest.webmanifest",
      headers: [
        {
          key: "Content-Type",
          value: "application/manifest+json",
        },
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    },
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, must-revalidate",
        },
        {
          key: "Service-Worker-Allowed",
          value: "/",
        },
      ],
    },
  ],
};

// PWA uses webpack — only enable for production builds so `next dev` can use Turbopack.
export default process.env.NODE_ENV === "production"
  ? withPWAInit(pwaOptions)(nextConfig)
  : nextConfig;
