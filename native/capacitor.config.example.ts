import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Copy to project root as capacitor.config.ts when wrapping for App Store.
 * @see docs/native-app-wrappers.md
 */
const config: CapacitorConfig = {
  appId: "se.ellstorpskrog.app",
  appName: "Ellstorps Krog",
  webDir: "out",
  server: {
    url: "https://www.ellstorpskrog.se",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f0f0f",
      showSpinner: false,
    },
  },
};

export default config;
