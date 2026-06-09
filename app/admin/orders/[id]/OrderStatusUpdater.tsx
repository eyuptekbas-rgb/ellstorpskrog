"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OrderStatus } from "@prisma/client";
import StatusSelect from "@/app/admin/orders/StatusSelect";

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
};

export default function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const handleUpdate = async () => {
    if (status === currentStatus) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error();

      router.refresh();
    } catch {
      setError("Kunde inte uppdatera status.");
      setStatus(currentStatus);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <StatusSelect value={status} onChange={setStatus} />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        onClick={handleUpdate}
        disabled={saving || status === currentStatus}
        className="w-full bg-[#b85c38] hover:bg-[#9e4e2f] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
      >
        {saving ? "Sparar…" : "Uppdatera status"}
      </button>
    </div>
  );
}
