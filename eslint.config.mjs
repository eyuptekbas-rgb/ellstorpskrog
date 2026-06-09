import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Hydration/localStorage patterns — warn only; does not block `next build`
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated PWA / tooling — not shipped as app source
    "public/sw.js",
    "public/workbox-*.js",
    "public/swe-worker-*.js",
    "public/fallback-*.js",
    "scripts/**",
  ]),
]);

export default eslintConfig;
