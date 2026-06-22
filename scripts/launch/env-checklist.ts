#!/usr/bin/env npx tsx
/**
 * Launch Priority 1 — production environment checklist.
 * Usage: npm run launch:env
 */
import { evaluateLaunchEnv, loadDotEnv } from "../../lib/env/launch-vars";

loadDotEnv();

const items = evaluateLaunchEnv();

console.log("\n=== Launch Environment Checklist ===\n");
console.log(
  "Variable".padEnd(28) +
    "Present".padEnd(10) +
    "Status".padEnd(12) +
    "Validated".padEnd(12) +
    "Note"
);
console.log("-".repeat(90));

for (const item of items) {
  const present = item.present ? "YES" : "NO";
  const validated = item.validated ? "YES" : "NO";
  const aliases =
    item.aliases.length > 0 ? ` (aliases: ${item.aliases.join(", ")})` : "";
  console.log(
    `${item.key.padEnd(28)}${present.padEnd(10)}${item.status.padEnd(12)}${validated.padEnd(12)}${item.validationNote ?? ""}${aliases}`
  );
}

const required = items.filter((i) => i.requiredForLaunch);
const requiredOk = required.filter((i) => i.status === "validated");
const optional = items.filter((i) => !i.requiredForLaunch);
const optionalOk = optional.filter((i) => i.status === "validated");

console.log("\n--- Summary ---");
console.log(`Required: ${requiredOk.length}/${required.length} validated`);
console.log(`Optional: ${optionalOk.length}/${optional.length} validated`);

const blockers = required.filter((i) => i.status !== "validated");
if (blockers.length) {
  console.log("\nLaunch blockers:");
  for (const b of blockers) {
    console.log(`  - ${b.key}: ${b.status} — ${b.validationNote ?? ""}`);
  }
  process.exitCode = 1;
} else {
  console.log("\nAll required launch variables validated.");
}
