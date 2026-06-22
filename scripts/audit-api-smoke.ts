/**
 * Backend flow smoke tests — run against local dev server.
 * Usage: npx tsx scripts/audit-api-smoke.ts [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:3000";

type Result = { name: string; ok: boolean; status?: number; detail?: string };

async function req(
  path: string,
  init?: RequestInit
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

async function main() {
  const results: Result[] = [];

  // Health
  {
    const { status, body } = await req("/api/health");
    const b = body as { status?: string };
    results.push({
      name: "GET /api/health",
      ok: status === 200 || status === 503,
      status,
      detail: b?.status,
    });
  }

  // Public settings
  {
    const { status, body } = await req("/api/settings/public");
    const b = body as { restaurantName?: string };
    results.push({
      name: "GET /api/settings/public",
      ok: status === 200 && Boolean(b?.restaurantName),
      status,
      detail: b?.restaurantName,
    });
  }

  // Public categories
  {
    const { status, body } = await req("/api/categories");
    results.push({
      name: "GET /api/categories (public)",
      ok: status === 200 && Array.isArray(body),
      status,
      detail: Array.isArray(body) ? `${(body as unknown[]).length} categories` : undefined,
    });
  }

  // Protected orders list (no auth)
  {
    const { status } = await req("/api/orders");
    results.push({
      name: "GET /api/orders (unauthenticated)",
      ok: status === 401,
      status,
      detail: status === 401 ? "Correctly blocked" : "Should be 401",
    });
  }

  // Protected admin settings
  {
    const { status } = await req("/api/settings");
    results.push({
      name: "GET /api/settings (unauthenticated)",
      ok: status === 401,
      status,
    });
  }

  // Platform tenants
  {
    const { status } = await req("/api/platform/tenants");
    results.push({
      name: "GET /api/platform/tenants (unauthenticated)",
      ok: status === 401,
      status,
    });
  }

  // Reservation validation
  {
    const { status, body } = await req("/api/reservations", {
      method: "POST",
      body: JSON.stringify({ name: "", phone: "", email: "" }),
    });
    const b = body as { error?: string };
    results.push({
      name: "POST /api/reservations (invalid)",
      ok: status === 400,
      status,
      detail: b?.error,
    });
  }

  // Order validation
  {
    const { status, body } = await req("/api/orders", {
      method: "POST",
      body: JSON.stringify({ customerName: "Test" }),
    });
    const b = body as { error?: string };
    results.push({
      name: "POST /api/orders (incomplete)",
      ok: status === 400,
      status,
      detail: b?.error,
    });
  }

  // Contact without email config may 503
  {
    const { status } = await req("/api/contact", {
      method: "POST",
      body: JSON.stringify({
        name: "Audit",
        email: "audit@test.se",
        message: "Smoke test",
      }),
    });
    results.push({
      name: "POST /api/contact",
      ok: status === 200 || status === 503,
      status,
      detail: status === 503 ? "Email not configured (expected in dev)" : "Sent",
    });
  }

  // Checkout session without stripe
  {
    const { status, body } = await req("/api/checkout/create-session", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Test",
        customerPhone: "0700000000",
        customerEmail: "test@test.se",
        orderType: "pickup",
        total: 100,
        items: [{ productName: "Test", quantity: 1, price: 100 }],
      }),
    });
    const b = body as { error?: string };
    results.push({
      name: "POST /api/checkout/create-session",
      ok: status === 503 || status === 201 || status === 500,
      status,
      detail: b?.error ?? "session created or stripe disabled",
    });
  }

  console.log(`\nAPI smoke tests @ ${BASE}\n`);
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}  [${r.status}]  ${r.detail ?? ""}`);
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error("Smoke tests could not run:", e.message);
  console.error("Is the dev server running? npm run dev");
  process.exit(1);
});
