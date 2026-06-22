export const POS_WAIT_TIME_MINUTES = [
  10, 15, 20, 25, 30, 35, 40, 45, 50,
] as const;

export type PosWaitTimeMinutes = (typeof POS_WAIT_TIME_MINUTES)[number];

export type CustomerWaitTimePayload = {
  orderId: string;
  minutes: PosWaitTimeMinutes;
};

export function isValidWaitTimeMinutes(
  minutes: number
): minutes is PosWaitTimeMinutes {
  return (POS_WAIT_TIME_MINUTES as readonly number[]).includes(minutes);
}

export async function sendCustomerWaitTime(
  payload: CustomerWaitTimePayload
): Promise<void> {
  const res = await fetch(`/api/orders/${payload.orderId}/wait-time`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ minutes: payload.minutes }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
}
