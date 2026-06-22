import type { RegisteredPrinter } from "@/lib/printing/printer-registry";

let activeRegisteredPrinter: RegisteredPrinter | null = null;

export function setActiveRegisteredPrinter(printer: RegisteredPrinter | null) {
  activeRegisteredPrinter = printer;
}

export function getActiveRegisteredPrinter(): RegisteredPrinter | null {
  return activeRegisteredPrinter;
}
