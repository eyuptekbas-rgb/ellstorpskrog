import { isEmailConfigured } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";
import { getStripeConfig } from "@/lib/stripe/config";

export type ServiceStatus = "ok" | "warning" | "error";

export type HealthCheckResult = {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  database: {
    status: ServiceStatus;
    message?: string;
  };
  auth: {
    status: ServiceStatus;
    message?: string;
  };
  stripe: {
    status: ServiceStatus;
    configured: boolean;
    enabled: boolean;
    testMode: boolean;
    message?: string;
  };
  email: {
    status: ServiceStatus;
    configured: boolean;
    message?: string;
  };
};

function authStatus(): HealthCheckResult["auth"] {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    return { status: "error", message: "AUTH_SECRET is not set" };
  }
  if (secret.length < 32) {
    return { status: "error", message: "AUTH_SECRET must be at least 32 characters" };
  }
  if (/change-me/i.test(secret)) {
    return { status: "warning", message: "AUTH_SECRET appears to be a placeholder" };
  }
  return { status: "ok" };
}

function emailStatus(): HealthCheckResult["email"] {
  const configured = isEmailConfigured();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const contactEmail = process.env.CONTACT_TO_EMAIL?.trim();

  if (!configured) {
    return {
      status: "warning",
      configured: false,
      message: "RESEND_API_KEY is not set — transactional email disabled",
    };
  }
  if (!fromEmail) {
    return {
      status: "warning",
      configured: true,
      message: "RESEND_FROM_EMAIL is not set",
    };
  }
  if (!contactEmail) {
    return {
      status: "warning",
      configured: true,
      message: "CONTACT_TO_EMAIL is not set — contact form may fail",
    };
  }
  return { status: "ok", configured: true };
}

export async function runHealthChecks(): Promise<HealthCheckResult> {
  let database: HealthCheckResult["database"] = { status: "ok" };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    database = {
      status: "error",
      message: error instanceof Error ? error.message : "Database unreachable",
    };
  }

  const auth = authStatus();
  const email = emailStatus();

  let stripe: HealthCheckResult["stripe"] = {
    status: "warning",
    configured: false,
    enabled: false,
    testMode: true,
    message: "Stripe config unavailable",
  };

  try {
    const config = await getStripeConfig();
    stripe = {
      configured: config.configured,
      enabled: config.enabled,
      testMode: config.testMode,
      status: config.enabled
        ? config.testMode
          ? "warning"
          : "ok"
        : config.configured
          ? "warning"
          : "warning",
      message: config.enabled
        ? config.testMode
          ? "Stripe enabled in test mode"
          : "Stripe enabled in live mode"
        : config.configured
          ? "Stripe keys present but disabled in admin settings"
          : "Stripe keys not configured (env or admin)",
    };
  } catch (error) {
    stripe = {
      status: "error",
      configured: false,
      enabled: false,
      testMode: true,
      message:
        error instanceof Error ? error.message : "Failed to load Stripe config",
    };
  }

  const statuses = [database.status, auth.status, stripe.status, email.status];
  const hasError = statuses.includes("error");
  const hasWarning = statuses.includes("warning");

  return {
    status: hasError ? "unhealthy" : hasWarning ? "degraded" : "healthy",
    timestamp: new Date().toISOString(),
    database,
    auth,
    stripe,
    email,
  };
}
