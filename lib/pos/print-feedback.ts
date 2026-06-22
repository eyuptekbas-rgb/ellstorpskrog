import type { PrintResult } from "@/lib/printing/types";
import { traceNoPrinterConfiguredToast } from "@/lib/printing/print-trace-runtime";

type PushToast = (text: string, tone?: "info" | "success" | "error") => void;

export function notifyPrintResult(
  pushToast: PushToast,
  label: string,
  result: PrintResult
) {
  if (result.success) {
    pushToast(`${label} skickad till skrivare`, "success");
    return;
  }
  traceNoPrinterConfiguredToast(label, result);
  pushToast(
    result.errorMessage ?? `${label} misslyckades`,
    "error"
  );
}
