/** @deprecated Use tools/print-agent/run.ts via npm run print-agent */
import { startPrintAgent } from "../print-agent/server";

startPrintAgent().catch((err) => {
  console.error(err);
  process.exit(1);
});
