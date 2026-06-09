"use client";

import { OrderStatus } from "@prisma/client";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/orders";

type Props = {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
};

export default function StatusSelect({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as OrderStatus)}
      className="w-full bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#b85c38]/50"
    >
      {ORDER_STATUSES.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
