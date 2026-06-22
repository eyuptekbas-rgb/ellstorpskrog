import type { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "@prisma/client";
import type { EscPosPrintContext } from "./escpos-context";

export type PrintableOrderItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type PrintableOrder = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string | null;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  note: string | null;
  adminNote: string | null;
  total: number;
  status: OrderStatus;
  estimatedReadyMinutes?: number | null;
  createdAt: string;
  items: PrintableOrderItem[];
};

export type PrintDocumentType = "receipt" | "kitchen-ticket";

export type PrintDocument = {
  type: PrintDocumentType;
  title: string;
  /** Raw ESC/POS bytes sent directly to the printer. */
  escpos: Uint8Array;
  context?: EscPosPrintContext;
};

export type PrintResult = {
  success: boolean;
  providerId: string;
  errorMessage?: string;
  printerState?: "online" | "offline" | "paper_out" | "cover_open" | "busy" | "error";
};

/** Provider-agnostic print transport (ESC/POS network, USB, Windows spooler, Android). */
export type PrinterProvider = {
  readonly id: string;
  readonly label: string;
  canPrint(): boolean;
  print(document: PrintDocument): Promise<PrintResult>;
};

/** Cash drawer kick — hardware-agnostic. */
export type CashDrawerProvider = {
  readonly id: string;
  readonly label: string;
  canOpen(): boolean;
  open(): Promise<{ success: boolean; errorMessage?: string }>;
};

export type PrinterProviderKind =
  | "network"
  | "network-escpos"
  | "usb"
  | "windows"
  | "browser"
  | "android";
