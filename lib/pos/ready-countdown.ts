import { OrderStatus } from "@prisma/client";

export type ReadyCountdown = {
  display: string;
  remainingSeconds: number;
  overdue: boolean;
};

export function getReadyCountdown(
  status: OrderStatus,
  confirmedAt: string | null,
  estimatedReadyMinutes: number | null,
  nowMs: number
): ReadyCountdown | null {
  if (
    (status !== OrderStatus.CONFIRMED && status !== OrderStatus.PREPARING) ||
    !confirmedAt ||
    !estimatedReadyMinutes ||
    estimatedReadyMinutes <= 0
  ) {
    return null;
  }

  const confirmedMs = new Date(confirmedAt).getTime();
  if (!Number.isFinite(confirmedMs)) return null;

  const deadlineMs = confirmedMs + estimatedReadyMinutes * 60_000;
  const rawSeconds = Math.ceil((deadlineMs - nowMs) / 1000);
  const remainingSeconds = Math.max(0, rawSeconds);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return {
    display: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    remainingSeconds,
    overdue: rawSeconds <= 0,
  };
}
