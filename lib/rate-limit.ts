type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const allowed = bucket.count <= limit;
  const remaining = Math.max(0, limit - bucket.count);

  return {
    allowed,
    limit,
    remaining,
    resetAt: bucket.resetAt,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/** Public POST routes and their per-IP limits (requests per minute). */
export const RATE_LIMITS: Record<string, number> = {
  "/api/contact": 5,
  "/api/reservations": 8,
  "/api/orders": 20,
  "/api/checkout/create-session": 15,
  "/api/payments/create": 15,
  "/api/faktura/lookup": 10,
  "/api/auth": 30,
  "/api/admin/terminals/heartbeat": 120,
  "/api/realtime/stream": 30,
  "/api/self-order": 20,
  "/api/account/register": 10,
};

/** Staff mutation routes — per-IP limits per minute. */
export const STAFF_MUTATION_RATE_LIMITS: Array<{
  prefix: string;
  limit: number;
  methods: string[];
}> = [
  { prefix: "/api/admin/", limit: 120, methods: ["POST", "PUT", "PATCH", "DELETE"] },
  { prefix: "/api/orders/", limit: 90, methods: ["PUT", "PATCH", "DELETE"] },
];
