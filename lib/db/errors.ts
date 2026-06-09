import { Prisma } from "@prisma/client";

const RECOVERABLE_CODES = [
  "P1000",
  "P1001",
  "P1017",
  "P2010",
  "P2021",
  "P2022",
];

/** True when the DB is unreachable or schema is out of sync with Prisma Client. */
export function isPrismaConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RECOVERABLE_CODES.includes(error.code);
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("can't reach database server") ||
      message.includes("connection refused") ||
      message.includes("connection terminated") ||
      message.includes("econnrefused") ||
      message.includes("does not exist") ||
      message.includes("authentication failed") ||
      message.includes("invalid `prisma.") ||
      message.includes("environment variable not found: database_url")
    );
  }

  return false;
}

export function getDbErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return error.message;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `${error.code}: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown database error";
}

export async function checkDatabaseConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getDbErrorMessage(error) };
  }
}

export async function checkSiteSettingsTable(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.siteSettings.findUnique({ where: { id: 1 } });
    return { ok: true };
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return { ok: false, error: getDbErrorMessage(error) };
    }
    throw error;
  }
}
