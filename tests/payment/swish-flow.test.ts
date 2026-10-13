import assert from "node:assert/strict";
import { after, before, it, mock } from "node:test";
import { EventEmitter } from "node:events";
import https from "node:https";
import tls from "node:tls";
import { randomUUID } from "node:crypto";
import * as nodeModule from "node:module";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadEnvConfig } from "@next/env";
import { prisma } from "../../lib/prisma";
import { validateSwishConfirmation } from "../../src/services/payment/providers/swish/verification";
import { buildCustomerReceiptPaymentInfo } from "../../lib/printing/escpos/receipt";
import type { PrintableOrder } from "../../lib/printing/types";

let service: typeof import("../../src/services/payment/server/payment-service")["paymentService"];
let confirm: typeof import("../../src/services/payment/server/swish-confirmation")["confirmSwishPayment"];
let callback: typeof import("../../app/api/webhooks/swish/route")["POST"];
let tokens: typeof import("../../src/services/payment/providers/swish/tokens");
let provider: typeof import("../../src/services/payment/providers/swish/swish-provider")["swishPaymentProvider"];
let tenantId = "";
const remote = new Map<string, Record<string, string>>();
const requests: { method: string; path: string; body: Record<string, string> }[] = [];
let createStatus = 201;
let cancelStatus = 200;
let getStatus = 200;
const originalRequest = https.request;
const savedEnv = new Map<string, string | undefined>();
type TestResolve = (specifier: string, context: unknown) => unknown;
const { registerHooks } = nodeModule as unknown as { registerHooks(hooks: {
  resolve(specifier: string, context: unknown, nextResolve: TestResolve): unknown;
}): { deregister(): void } };
const serverOnlyHook = registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier, context);
} });
const testRequire = nodeModule.createRequire(process.cwd() + "/package.json");
const originalModules = new Map<string, NodeModule | undefined>();
const reactGlobal = globalThis as typeof globalThis & { React?: typeof React };
const originalReact = reactGlobal.React;
const printedOrders: PrintableOrder[] = [];

before(async () => {
  reactGlobal.React = React;
  // Only stub Next request-context resolution; authorization predicates in the
  // handlers and actual PostgreSQL transactions are exercised below.
  for (const [path, exports] of Object.entries({
    "./lib/tenant/admin-api.ts": { getAdminTenantId: async () => process.env.SWISH_TEST_TENANT_ID, tenantApiError: () => null },
    "./lib/tenant/resolve.ts": { resolvePublicTenantId: async () => process.env.SWISH_TEST_TENANT_ID },
    "./components/notifications/ToastProvider.tsx": { useToast: () => ({ pushToast: () => undefined }) },
    "./lib/orders/print.ts": {
      printReceipt: async (order: PrintableOrder) => { printedOrders.push(order); return { success: true }; },
      printKitchenTicket: async (order: PrintableOrder) => { printedOrders.push(order); return { success: true }; },
    },
  })) {
    const id = testRequire.resolve(path);
    originalModules.set(id, testRequire.cache[id]);
    testRequire.cache[id] = { id, filename: id, loaded: true, exports } as NodeModule;
  }
  loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL!).hostname), "Database tests are local-only");
  for (const [key, value] of Object.entries({ SWISH_CERT_PEM: "test-certificate", SWISH_KEY_PEM: "test-key", SWISH_CALLBACK_SECRET: "test-only-swish-secret-with-more-than-32-characters", SWISH_APP_URL: "https://restaurant.example", SWISH_API_BASE_URL: "https://mss.cpc.getswish.net" })) {
    savedEnv.set(key, process.env[key]); process.env[key] = value;
  }
  // No real certificates or network requests: exercise request construction and persistence.
  mock.method(tls, "createSecureContext", () => ({}));
  https.request = ((options: https.RequestOptions, listener: (response: unknown) => void) => {
    assert.equal(options.hostname, "mss.cpc.getswish.net");
    assert.equal(options.rejectUnauthorized, true);
    assert.equal(options.minVersion, "TLSv1.2");
    assert.equal(Buffer.from(options.cert as Buffer).toString(), "test-certificate");
    const req = new EventEmitter() as EventEmitter & { write: (body: string) => void; end: () => void; setTimeout: () => void };
    let body = "";
    req.write = chunk => { body += chunk; };
    req.setTimeout = () => {};
    req.end = () => { void (async () => {
      const path = String(options.path);
      const id = path.split("/").at(-1)!;
      const data = body ? JSON.parse(body) : {};
      requests.push({ method: String(options.method), path, body: data });
      const response = new EventEmitter() as EventEmitter & { statusCode: number; headers: Record<string, string> };
      response.headers = {};
      if (options.method === "PUT") {
        assert.match(path, /^\/swish-cpcapi\/api\/v2\/paymentrequests\/[A-F0-9]{32}$/);
        const stored = await prisma.payment.findUnique({ where: { provider_providerPaymentId: { provider: "swish", providerPaymentId: id } } });
        assert.ok(stored, "Instruction was committed before sending to Swish");
        assert.equal(stored.status, "PENDING");
        remote.set(id, { ...data, id, status: "CREATED" });
        response.statusCode = createStatus;
        response.headers.location = `https://mss.cpc.getswish.net${path}`;
      } else if (options.method === "PATCH") {
        assert.deepEqual(data, [{ op: "replace", path: "/status", value: "cancelled" }]);
        response.statusCode = cancelStatus;
        if (cancelStatus === 200) remote.get(id)!.status = "CANCELLED";
      } else {
        assert.match(path, /^\/swish-cpcapi\/api\/v1\/paymentrequests\//);
        response.statusCode = getStatus;
      }
      listener(response);
      response.emit("data", Buffer.from(JSON.stringify(options.method === "GET" ? remote.get(id) : null)));
      response.emit("end");
    })().catch(error => req.emit("error", error)); };
    return req;
  }) as unknown as typeof https.request;
  ({ paymentService: service } = await import("../../src/services/payment/server/payment-service"));
  ({ confirmSwishPayment: confirm } = await import("../../src/services/payment/server/swish-confirmation"));
  ({ POST: callback } = await import("../../app/api/webhooks/swish/route"));
  tokens = await import("../../src/services/payment/providers/swish/tokens");
  ({ swishPaymentProvider: provider } = await import("../../src/services/payment/providers/swish/swish-provider"));
  const tenant = await prisma.tenant.create({ data: { id: `tenant_swish_test_${randomUUID()}`, slug: `swish-test-${randomUUID()}`, name: "Temporary Swish Test" } });
  tenantId = tenant.id;
  savedEnv.set("SWISH_TEST_TENANT_ID", process.env.SWISH_TEST_TENANT_ID);
  process.env.SWISH_TEST_TENANT_ID = tenantId;
  await prisma.businessPaymentSettings.create({ data: { businessId: tenantId, swishEnabled: true, swishMerchantNumber: "1234679304", isLive: false } });
});

after(async () => {
  https.request = originalRequest;
  mock.restoreAll();
  if (tenantId) {
    await prisma.paymentWebhookEvent.deleteMany({ where: { payment: { businessId: tenantId } } });
    await prisma.tenant.delete({ where: { id: tenantId } });
  }
  for (const [key, value] of savedEnv) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  await prisma.$disconnect();
  serverOnlyHook.deregister();
  for (const [id, original] of originalModules) {
    if (original) testRequire.cache[id] = original; else delete testRequire.cache[id];
  }
  if (originalReact === undefined) Reflect.deleteProperty(reactGlobal, "React"); else reactGlobal.React = originalReact;
});

async function newOrder() {
  return prisma.order.create({ data: { tenantId, orderNumber: randomUUID(), customerName: "Test", customerEmail: "test@example.invalid", customerPhone: "0701234567", orderType: "PICKUP", paymentMethod: "SWISH", total: 199 } });
}
async function create() {
  const order = await newOrder();
  const result = await service.createPayment({ orderId: order.id, businessId: tenantId, method: "SWISH", amount: "199.00", currency: "SEK" });
  return { order, result, snapshot: remote.get(result.payment.providerPaymentId!)! };
}

it("creates direct Swish with persisted UUID, normalized payer and pending order", async () => {
  const { order, result, snapshot } = await create();
  assert.equal(result.payment.provider, "swish");
  assert.equal(result.payment.status, "PENDING");
  assert.equal(snapshot.payerAlias, "46701234567");
  assert.equal(snapshot.payeeAlias, "1234679304");
  assert.equal(snapshot.amount, "199.00");
  assert.match(result.actionUrl!, /^\/checkout\/success\?swish_payment_id=/);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus, "PENDING");
  await assert.rejects(service.createPayment({ orderId: order.id, businessId: tenantId, method: "SWISH", amount: "199.00", currency: "SEK" }), /already exists/);
});

it("rejects manipulated amount and currency before any Swish request", async () => {
  const order = await newOrder(); const count = requests.length;
  for (const input of [{ amount: "1.00", currency: "SEK" }, { amount: "199.00", currency: "EUR" }] as const) {
    await assert.rejects(service.createPayment({ orderId: order.id, businessId: tenantId, method: "SWISH", ...input }), /Invalid Swish/);
  }
  assert.equal(requests.length, count);
});

it("online checkout uses server catalog pricing and routes SWISH without a card provider", async () => {
  const { createCheckoutPayment } = await import("../../src/services/payment/server/checkout/create-checkout-payment");
  const category = await prisma.category.create({ data: { tenantId, name: "Test", slug: "swish-test" } });
  const product = await prisma.product.create({ data: { categoryId: category.id, name: "Test meal", description: "Test", price: 199 } });
  const result = await createCheckoutPayment(tenantId, {
    customerName: "Test", customerPhone: "+4512345678", swishPayerPhone: "0701234567", customerEmail: "test@example.invalid", orderType: "afhentning",
    total: 1, paymentMethod: "SWISH", items: [{ productId: product.id, productName: "Test meal", quantity: 1, price: 1 }],
  });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("Checkout failed");
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: result.paymentId } });
  assert.equal(payment.provider, "swish"); assert.equal(payment.amount.toFixed(2), "199.00");
  assert.equal(requests.filter(r => r.method === "PUT").at(-1)?.body.payerAlias, "46701234567");
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } })).customerPhone, "+4512345678");
  const requestCount = requests.length;
  const orderCount = await prisma.order.count({ where: { tenantId } });
  const invalid = await createCheckoutPayment(tenantId, {
    customerName: "Test", customerPhone: "0701234567", swishPayerPhone: "invalid", customerEmail: "test@example.invalid", orderType: "afhentning",
    total: 199, paymentMethod: "SWISH", items: [{ productId: product.id, productName: "Test meal", quantity: 1, price: 199 }],
  });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.status, 400);
  assert.equal(requests.length, requestCount);
  assert.equal(await prisma.order.count({ where: { tenantId } }), orderCount);
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } })).paymentStatus, "PENDING");
});

it("ignores forged callback body and rejects invalid tokens", async () => {
  const { result, snapshot } = await create();
  const forged = new Request(`${snapshot.callbackUrl}`, { method: "POST", body: JSON.stringify({ status: "PAID", amount: "1" }) });
  assert.equal((await callback(forged)).status, 200);
  assert.equal((await prisma.payment.findUniqueOrThrow({ where: { id: result.payment.id } })).status, "PENDING");
  assert.equal((await callback(new Request("https://restaurant.example/api/webhooks/swish?paymentId=x&secret=wrong", { method: "POST" }))).status, 401);
  assert.equal(tokens.validSwishToken(result.payment.id, "callback", tokens.swishToken(result.payment.id, "status")), false);
  await assert.rejects(provider.parseWebhook({ rawBody: '{"id":"forged","status":"PAID"}', headers: new Headers() }), /verified mTLS/);
});

it("atomically confirms PAID once, preserves Swish method and never downgrades paid", async () => {
  const { order, result, snapshot } = await create();
  snapshot.status = "PAID"; snapshot.paymentReference = "REALISTIC_TEST_REFERENCE";
  await Promise.all([confirm(result.payment.id), confirm(result.payment.id)]);
  const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(paid.paymentStatus, "PAID"); assert.equal(paid.paymentMethod, "SWISH");
  assert.equal(paid.stripeSessionId, null);
  assert.equal(await prisma.paymentWebhookEvent.count({ where: { paymentId: result.payment.id, eventId: `${snapshot.id}:PAID` } }), 1);
  snapshot.status = "ERROR";
  await confirm(result.payment.id);
  assert.equal((await prisma.payment.findUniqueOrThrow({ where: { id: result.payment.id } })).status, "PAID");
});

it("handles declined/error/cancelled and retries verification failures without consuming events", async () => {
  for (const [status, expected] of [["DECLINED", "FAILED"], ["ERROR", "FAILED"], ["CANCELLED", "CANCELLED"]]) {
    const { order, result, snapshot } = await create(); snapshot.status = status;
    getStatus = 503;
    await assert.rejects(confirm(result.payment.id), /unavailable/);
    assert.equal(await prisma.paymentWebhookEvent.count({ where: { paymentId: result.payment.id } }), 0);
    getStatus = 200;
    await confirm(result.payment.id);
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus, expected);
  }
});

it("checks authoritative amount, payee, currency and references before mutation", async () => {
  const { result, snapshot } = await create();
  // Swish GET can return a JSON number rather than a decimal string.
  assert.doesNotThrow(() => validateSwishConfirmation({ id: result.payment.id, providerPaymentId: result.payment.providerPaymentId, amount: "199.00", currency: "SEK" }, { ...snapshot, id: snapshot.id, amount: 199 }, "1234679304"));
  for (const change of [{ amount: "1.00" }, { amount: "199.001" }, { payeeAlias: "1230000000" }, { currency: "EUR" }, { payeePaymentReference: "other" }, { id: "other" }]) {
    assert.throws(() => validateSwishConfirmation({ id: result.payment.id, providerPaymentId: result.payment.providerPaymentId, amount: "199.00", currency: "SEK" }, { ...snapshot, ...change, id: change.id ?? snapshot.id }, "1234679304"), /does not match/);
  }
  const amount = snapshot.amount; snapshot.amount = "1.00";
  await assert.rejects(confirm(result.payment.id), /does not match/); snapshot.amount = amount;
  assert.equal(await prisma.paymentWebhookEvent.count({ where: { paymentId: result.payment.id } }), 0);
});

it("does not claim cancellation when Swish rejects it", async () => {
  const { result } = await create(); cancelStatus = 422;
  await assert.rejects(service.cancelPayment(tenantId, result.payment.id), /not confirmed/);
  assert.equal((await prisma.payment.findUniqueOrThrow({ where: { id: result.payment.id } })).status, "PENDING");
  cancelStatus = 200;
  await service.cancelPayment(tenantId, result.payment.id);
  await confirm(result.payment.id);
  assert.equal((await prisma.payment.findUniqueOrThrow({ where: { id: result.payment.id } })).status, "CANCELLED");
});

it("keeps ambiguous creation pending and definitive rejection failed", async () => {
  createStatus = 503; const uncertain = await create();
  assert.equal(uncertain.result.payment.status, "PENDING"); assert.ok(uncertain.result.actionUrl);
  createStatus = 422; const failed = await create();
  assert.equal(failed.result.payment.status, "FAILED");
  createStatus = 201;
});

it("prints Swish only when the persisted Swish payment is paid", () => {
  for (const paymentStatus of ["PENDING", "PROCESSING", "FAILED", "CANCELLED", "REFUNDED"] as const) {
    assert.equal(buildCustomerReceiptPaymentInfo({ paymentMethod: "SWISH", paymentStatus } as PrintableOrder), null);
  }
  for (const swishConfirmed of [undefined, false]) {
    assert.equal(buildCustomerReceiptPaymentInfo({ paymentMethod: "SWISH", paymentStatus: "PAID", swishConfirmed } as PrintableOrder), null);
  }
  assert.equal(buildCustomerReceiptPaymentInfo({ paymentMethod: "SWISH", paymentStatus: "PAID", swishConfirmed: true } as PrintableOrder)?.methodLabel, "Swish");
});

async function splitPayment(orderId: string, swishLine = false) {
  const { POST } = await import("../../app/api/admin/pos/split-payment/route");
  return POST(new Request("http://localhost/api/admin/pos/split-payment", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, lines: [
      { method: swishLine ? "SWISH" : "ON_PICKUP", amount: "99.00" },
      { method: "ON_PICKUP", amount: "100.00" },
    ] }),
  }));
}

it("POS cannot bypass pending Swish with either Swish or non-Swish split lines", async () => {
  const { order, result, snapshot } = await create();
  for (const swishLine of [true, false]) {
    const response = await splitPayment(order.id, swishLine);
    assert.equal(response.status, 409);
    assert.equal(await prisma.payment.count({ where: { orderId: order.id } }), 1);
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus, "PENDING");
    assert.equal((await prisma.payment.findUniqueOrThrow({ where: { id: result.payment.id } })).status, "PENDING");
  }
  // Even a changed order method cannot conceal the pending Swish record.
  await prisma.order.update({ where: { id: order.id }, data: { paymentMethod: "ON_PICKUP" } });
  assert.equal((await splitPayment(order.id)).status, 409);
  snapshot.status = "PAID"; snapshot.paymentReference = "VERIFIED_TEST_PAYMENT";
  assert.equal((await callback(new Request(snapshot.callbackUrl, { method: "POST" }))).status, 200);
  const confirmed = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(confirmed.paymentStatus, "PAID"); assert.equal(confirmed.paymentMethod, "SWISH");
  const accepted = await Promise.all([splitPayment(order.id, true), splitPayment(order.id, true)]);
  assert.deepEqual(accepted.map(response => response.status), [200, 200]);
  assert.equal(await prisma.payment.count({ where: { orderId: order.id } }), 1);
});

it("POS rejects invented Swish lines and preserves tenant isolation and ordinary split payments", async () => {
  const order = await newOrder();
  await prisma.order.update({ where: { id: order.id }, data: { paymentMethod: "ON_PICKUP" } });
  assert.equal((await splitPayment(order.id, true)).status, 409);
  assert.equal(await prisma.payment.count({ where: { orderId: order.id } }), 0);
  process.env.SWISH_TEST_TENANT_ID = "different-tenant";
  try { assert.equal((await splitPayment(order.id)).status, 404); }
  finally { process.env.SWISH_TEST_TENANT_ID = tenantId; }
  const results = await Promise.all([splitPayment(order.id), splitPayment(order.id)]);
  assert.deepEqual(results.map(response => response.status).sort(), [200, 409]);
  assert.equal(await prisma.payment.count({ where: { orderId: order.id } }), 2);
});

function renderedText(node: React.ReactNode): string[] {
  if (typeof node === "string" || typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return renderedText(node.props.children);
  return [];
}

type ElementProps = { children?: React.ReactNode; order?: PrintableOrder; onClick?: (event: { stopPropagation(): void }) => void };
function renderedElements(node: React.ReactNode): React.ReactElement<ElementProps>[] {
  if (Array.isArray(node)) return node.flatMap(renderedElements);
  if (!React.isValidElement<ElementProps>(node)) return [];
  return [node, ...renderedElements(node.props.children)];
}

it("admin order detail refuses another tenant's order", async () => {
  const { default: AdminOrder } = await import("../../app/admin/orders/[id]/page");
  const order = await newOrder();
  const otherTenant = await prisma.tenant.create({ data: { slug: `swish-isolation-${randomUUID()}`, name: "Other test tenant" } });
  process.env.SWISH_TEST_TENANT_ID = otherTenant.id;
  try {
    await assert.rejects(AdminOrder({ params: Promise.resolve({ id: order.id }) }),
      (error: unknown) => error instanceof Error && "digest" in error && error.digest === "NEXT_HTTP_ERROR_FALLBACK;404");
  } finally {
    process.env.SWISH_TEST_TENANT_ID = tenantId;
    await prisma.tenant.delete({ where: { id: otherTenant.id } });
  }
  assert.ok(renderedText(await AdminOrder({ params: Promise.resolve({ id: order.id }) })).includes("Ej bekräftad"));
});

it("POS receives a newly confirmed Swish order and tenant-scoped realtime updates", async () => {
  const { subscribeTenant } = await import("../../lib/realtime/bus");
  const { GET } = await import("../../app/api/orders/route");
  const { isPosVisibleOrder } = await import("../../lib/pos/queue-columns");
  const events: string[] = [];
  const otherEvents: string[] = [];
  const unsubscribe = subscribeTenant(tenantId, event => events.push(event.type));
  const unsubscribeOther = subscribeTenant("other-tenant", event => otherEvents.push(event.type));
  try {
    const { order, result, snapshot } = await create();
    const read = async () => {
      const response = await GET(new Request("http://localhost/api/orders?group=POS"));
      assert.equal(response.status, 200);
      return (await response.json()).find((row: { id: string }) => row.id === order.id);
    };
    assert.equal(isPosVisibleOrder(await read()), false);
    snapshot.status = "PAID"; snapshot.paymentReference = "POS_REALTIME_TEST";
    await confirm(result.payment.id);
    const row = await read();
    assert.equal(row.swishConfirmed, true);
    assert.equal(isPosVisibleOrder(row), true);
    assert.equal("payments" in row, false);
    assert.equal(events.filter(type => type === "NewOrder").length, 1);
    await confirm(result.payment.id);
    assert.equal(events.filter(type => type === "NewOrder").length, 1);
    assert.equal((await splitPayment(order.id, true)).status, 200);
    assert.ok(events.includes("OrderUpdated"));
    assert.deepEqual(otherEvents, []);
    process.env.SWISH_TEST_TENANT_ID = "other-tenant";
    try { assert.equal(await read(), undefined); }
    finally { process.env.SWISH_TEST_TENANT_ID = tenantId; }
  } finally { unsubscribe(); unsubscribeOther(); }
});

it("POS and admin labels require a persisted confirmed Swish payment", async () => {
  const { GET } = await import("../../app/api/orders/route");
  const { default: PosOrder } = await import("../../components/pos/kiosk/PosKioskOrder");
  const { default: AdminOrder } = await import("../../app/admin/orders/[id]/page");
  const { default: OrderCard } = await import("../../components/admin/orders/OrderCard");
  const { isPosActionableOrder, isPosVisibleOrder, partitionPosQueueOrders } = await import("../../lib/pos/queue-columns");
  const { toPrintableOrder } = await import("../../lib/pos/printable-order");
  const { order, result, snapshot } = await create();
  const checkLabels = async (confirmed: boolean) => {
    const response = await GET(new Request("http://localhost/api/orders"));
    assert.equal(response.status, 200);
    const rows = await response.json();
    const row = rows.find((value: { id: string }) => value.id === order.id);
    assert.equal(row.swishConfirmed, confirmed);
    const html = renderToStaticMarkup(React.createElement(PosOrder, { order: row, nowMs: Date.now() }));
    const adminTree = await AdminOrder({ params: Promise.resolve({ id: order.id }) });
    const text = renderedText(adminTree);
    assert.equal(isPosActionableOrder(row), confirmed);
    assert.equal(isPosVisibleOrder(row), confirmed);
    assert.equal(partitionPosQueueOrders([row]).new.length, confirmed ? 1 : 0);
    assert.equal(isPosActionableOrder({ ...row, paymentStatus: "PAID", swishConfirmed: undefined }), false);
    assert.equal(isPosActionableOrder({ ...row, paymentStatus: "PENDING", swishConfirmed: true }), false);
    const adminPrintOrder = renderedElements(adminTree).find(element => element.props.order)?.props.order;
    assert.ok(adminPrintOrder);
    for (const printable of [toPrintableOrder(row), adminPrintOrder]) {
      assert.equal(printable.swishConfirmed, confirmed);
      assert.equal(buildCustomerReceiptPaymentInfo(printable)?.methodLabel ?? null, confirmed ? "Swish" : null);
      if (!confirmed) assert.notEqual(printable.paymentStatus, "PAID");
    }
    const card = OrderCard({ order: row, restaurantName: "Test", acting: false, onAction: async () => undefined });
    const cardText = renderedText(card);
    assert.equal(cardText.includes("Betald"), confirmed);
    const printButton = renderedElements(card).find(element => element.type === "button" && renderedText(element).includes("Kvitto"));
    assert.ok(printButton?.props.onClick);
    printButton.props.onClick({ stopPropagation() {} });
    const printed = printedOrders.at(-1);
    assert.ok(printed);
    assert.equal(printed.swishConfirmed, confirmed);
    assert.equal(buildCustomerReceiptPaymentInfo(printed)?.methodLabel ?? null, confirmed ? "Swish" : null);
    if (confirmed) {
      assert.match(html, /Swish/); assert.ok(text.includes("Swish"));
      assert.doesNotMatch(html, /Ej bekräftad/); assert.ok(!text.includes("Ej bekräftad"));
    } else {
      assert.match(html, /Ej bekräftad/); assert.ok(text.includes("Ej bekräftad"));
      assert.doesNotMatch(html, /Swish|pos-pro-order__badge--paid/); assert.ok(!text.includes("Swish"));
    }
  };
  await checkLabels(false);
  // A legacy/manual order PAID flag is not proof of a paid Swish Payment.
  await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
  await prisma.payment.create({ data: {
    orderId: order.id, businessId: tenantId, method: "SWISH", provider: "pos",
    status: "PAID", amount: 199, currency: "SEK", paidAt: new Date(),
  } });
  await checkLabels(false);
  await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PENDING" } });
  for (const status of ["DECLINED", "ERROR", "CANCELLED"] as const) {
    snapshot.status = status;
    await confirm(result.payment.id);
    await checkLabels(false);
  }
  snapshot.status = "PAID"; snapshot.paymentReference = "VERIFIED_TEST_LABEL";
  await confirm(result.payment.id);
  await checkLabels(true);
});
