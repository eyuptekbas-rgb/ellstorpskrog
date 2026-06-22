"use client";

import { Printer } from "lucide-react";
import { useState } from "react";
import { printKitchenTicket, printReceipt } from "@/lib/orders/print";
import type { PrintableOrder } from "@/lib/orders/print";

type Props = {
  order: PrintableOrder;
  restaurantName?: string;
};

export default function OrderPrintButton({
  order,
  restaurantName = "Ellstorps Krog",
}: Props) {
  const [busy, setBusy] = useState<"kitchen" | "receipt" | null>(null);

  async function handleKitchenPrint() {
    setBusy("kitchen");
    try {
      await printKitchenTicket(order, restaurantName, { stationName: "KÖK" });
    } finally {
      setBusy(null);
    }
  }

  async function handleReceiptPrint() {
    setBusy("receipt");
    try {
      await printReceipt(order, restaurantName);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void handleKitchenPrint()}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
      >
        <Printer size={16} />
        {busy === "kitchen" ? "Skriver…" : "Kök"}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void handleReceiptPrint()}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
      >
        <Printer size={16} />
        {busy === "receipt" ? "Skriver…" : "Kvitto"}
      </button>
    </div>
  );
}
