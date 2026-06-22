/**
 * Monthly platform billing job.
 * Usage: npx tsx scripts/run-monthly-billing.ts [--no-send] [--year=2026] [--month=5]
 */
import { runMonthlyBillingJob } from "../lib/billing/service";
import { parsePeriodInput } from "../lib/billing/period";

async function main() {
  const args = process.argv.slice(2);
  const autoSend = !args.includes("--no-send");

  const yearArg = args.find((a) => a.startsWith("--year="))?.split("=")[1];
  const monthArg = args.find((a) => a.startsWith("--month="))?.split("=")[1];
  const period = parsePeriodInput(yearArg, monthArg) ?? undefined;

  const result = await runMonthlyBillingJob({ period, autoSend });

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
