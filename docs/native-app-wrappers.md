# Native App Store Wrappers

This PWA is prepared for wrapping as native Android and iOS apps.

## Prerequisites

- Production HTTPS domain (`NEXT_PUBLIC_APP_URL`)
- Valid `manifest.webmanifest` and service worker (`sw.js`) deployed
- Icons in `public/icons/` (192, 512, maskable, apple-touch)

## Android — Google Play (TWA / Bubblewrap)

Trusted Web Activity wraps the PWA in a Chrome-based Android app.

### 1. Digital Asset Links

Update `public/.well-known/assetlinks.json` with your signing certificate SHA-256:

```bash
keytool -list -v -keystore your-release-key.keystore -alias your-alias
```

Deploy so `https://yourdomain.com/.well-known/assetlinks.json` is publicly accessible.

### 2. Initialize TWA

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://yourdomain.com/manifest.webmanifest
bubblewrap build
```

Package name: `se.ellstorpskrog.app` (see `lib/pwa/config.ts`)

### 3. Play Store listing

- Use `public/icons/icon-512.png` as store icon
- Feature graphic: 1024×500
- Privacy policy URL required

## iOS — App Store (Capacitor)

Apple requires a native shell; Capacitor loads your deployed PWA URL or static export.

### 1. Copy config

```bash
cp native/capacitor.config.example.ts capacitor.config.ts
```

### 2. Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Ellstorps Krog" se.ellstorpskrog.app
npx cap add ios
```

### 3. Point to production URL

In `capacitor.config.ts`:

```typescript
server: {
  url: "https://www.ellstorpskrog.se",
  cleartext: false,
},
```

Or use `next export` / static output into `webDir` for fully bundled offline app.

### 4. Splash & icons

- Splash: `public/splash/*.png`
- App icon: `public/icons/apple-touch-icon.png` → Xcode Assets

## Shared configuration

| Setting | Location |
|---------|----------|
| App name | `lib/pwa/config.ts` → `PWA.name` |
| Theme color | `#b85c38` |
| Android package | `NATIVE_WRAPPER.androidPackage` |
| iOS bundle ID | `NATIVE_WRAPPER.iosBundleId` |
| URL scheme | `ellstorpskrog://` |

## Lighthouse PWA checklist

1. Serve over HTTPS in production
2. Run `npm run build && npm start` — verify `sw.js` loads
3. Visit `/`, `/menu`, `/kontakt` once online (precache)
4. Test offline in DevTools → Application → Service Workers
5. Run Lighthouse → Progressive Web App audit

## Regenerate icons & splash

```bash
npm run pwa:assets
```

Place a new master icon at `public/icons/icon-512.png` before running.
