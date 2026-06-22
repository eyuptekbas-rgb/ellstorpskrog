#!/usr/bin/env npx tsx
/**
 * Launch Readiness Sprint — runs all verification scripts and prints Go/No-Go.
 * Usage: npm run launch:sprint [baseUrl]
 */
import { spawnSync } from "node:child_process";
import { evaluateLaunchEnv, loadDotEnv } from "../../lib/env/launch-vars";

loadDotEnv();

const baseUrl = process.argv[2] ?? "http://localhost:3000";

function run(name: string, script: string, args: string[] = []) {
  console.log(`\n${"=".repeat(60)}\n>>> ${name}\n${"=".repeat(60)}\n`);
  const result = spawnSync("npx", ["tsx", script, ...args], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });
  return result.status ?? 1;
}

console.log("LAUNCH READINESS SPRINT");
console.log(`Started: ${new Date().toISOString()}`);

const envExit = run("Priority 1: Environment checklist", "scripts/launch/env-checklist.ts");
const testExit = run("Unit tests", "node", [
  "--import",
  "tsx",
  "--test",
  "tests/billing/**/*.test.ts",
  "tests/security/**/*.test.ts",
]);

let e2eExit = 1;
let isolationExit = 1;

e2eExit = run("Priority 2: E2E verification", "scripts/launch/e2e-verify.ts", [baseUrl]);
isolationExit = run("Priority 4: Tenant isolation", "scripts/launch/tenant-isolation-verify.ts");

const envItems = evaluateLaunchEnv();
const required = envItems.filter((i) => i.requiredForLaunch);
const requiredValidated = required.filter((i) => i.status === "validated").length;

const scores = {
  production: Math.round(
    (requiredValidated / required.length) * 40 +
      (envExit === 0 ? 0 : 0) +
      (e2eExit === 0 ? 30 : e2eExit === 1 ? 10 : 0) +
      (testExit === 0 ? 20 : 0) +
      10
  ),
  security: testExit === 0 && isolationExit === 0 ? 78 : testExit === 0 ? 70 : 55,
  multiTenant: isolationExit === 0 ? 75 : 60,
  billing: testExit === 0 ? 80 : 65,
};

console.log(`\n${"=".repeat(60)}`);
console.log("SPRINT SUMMARY");
console.log("=".repeat(60));
console.log(`Environment checklist exit: ${envExit === 0 ? "OK" : "BLOCKED"}`);
console.log(`Unit tests exit: ${testExit === 0 ? "OK" : "FAIL"}`);
console.log(`E2E verification exit: ${e2eExit === 0 ? "OK" : "BLOCKED/PARTIAL"}`);
console.log(`Tenant isolation exit: ${isolationExit === 0 ? "OK" : "BLOCKED/PARTIAL"}`);
console.log(`\nRequired env validated: ${requiredValidated}/${required.length}`);
console.log(`Production readiness: ~${Math.min(scores.production, 100)}%`);
console.log(`Security: ~${scores.security}%`);
console.log(`Multi-tenant: ~${scores.multiTenant}%`);
console.log(`Billing: ~${scores.billing}%`);

const blockers: string[] = [];
if (envExit !== 0) blockers.push("Production environment variables incomplete");
if (e2eExit !== 0) blockers.push("E2E verification failed or database unreachable");
if (isolationExit !== 0) blockers.push("Tenant isolation not fully verified");
if (testExit !== 0) blockers.push("Unit tests failed");

const go = blockers.length === 0 && requiredValidated === required.length;

console.log(`\nGo / No-Go: ${go ? "GO (staging pilot)" : "NO-GO"}`);
if (blockers.length) {
  console.log("\nLaunch blockers:");
  for (const b of blockers) {
    console.log(`  - ${b}`);
  }
}

console.log(`\nFull report: docs/operations/LAUNCH_READINESS_SPRINT.md`);
process.exit(go ? 0 : 1);
