import { evaluateLaunchEnv } from "@/lib/env/launch-vars";
import { runHealthChecks } from "@/lib/health/checks";
import { collectRuntimeMetrics } from "@/lib/monitoring/metrics";

export type DeploymentDiagnostics = {
  timestamp: string;
  ready: boolean;
  health: Awaited<ReturnType<typeof runHealthChecks>>;
  env: ReturnType<typeof evaluateLaunchEnv>;
  runtime: ReturnType<typeof collectRuntimeMetrics>;
  security: {
    authSecretOk: boolean;
    httpsRecommended: boolean;
    missingRequiredEnv: string[];
  };
};

export async function runDeploymentDiagnostics(): Promise<DeploymentDiagnostics> {
  const health = await runHealthChecks();
  const env = evaluateLaunchEnv();
  const runtime = collectRuntimeMetrics();

  const missingRequiredEnv = env
    .filter((item) => item.requiredForLaunch && item.status === "missing")
    .map((item) => item.key);

  const authItem = env.find((item) => item.key === "AUTH_SECRET");
  const urlItem = env.find((item) => item.key === "NEXT_PUBLIC_APP_URL");

  const ready =
    health.status !== "unhealthy" &&
    missingRequiredEnv.length === 0 &&
    authItem?.validated === true;

  return {
    timestamp: new Date().toISOString(),
    ready,
    health,
    env,
    runtime,
    security: {
      authSecretOk: authItem?.validated === true,
      httpsRecommended: urlItem?.validationNote?.includes("HTTPS") ?? false,
      missingRequiredEnv,
    },
  };
}
