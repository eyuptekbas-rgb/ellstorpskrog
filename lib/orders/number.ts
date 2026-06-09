import type { PrismaClient } from "@prisma/client";

export async function generateOrderNumber(
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
  >
): Promise<string> {
  const last = await tx.order.findFirst({
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const lastNum = last
    ? parseInt(last.orderNumber.replace(/^EK-/, ""), 10)
    : 0;

  const nextNum = (Number.isNaN(lastNum) ? 0 : lastNum) + 1;
  return `EK-${String(nextNum).padStart(6, "0")}`;
}
