export type { PrintableOrder, PrintableOrderItem } from "@/lib/printing/types";
export type { EscPosPrintContext } from "@/lib/printing/escpos-context";
export {
  printReceipt,
  printKitchenTicket,
  reprintReceipt,
} from "@/lib/printing/printer";
