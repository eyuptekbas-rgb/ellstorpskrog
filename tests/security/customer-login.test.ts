import assert from "node:assert/strict";
import { after, before, beforeEach, it, mock } from "node:test";
import { NextRequest } from "next/server";
import { hashPassword } from "../../lib/auth/password";
import { prisma } from "../../lib/prisma";

const originalSecret = process.env.AUTH_SECRET;
let handlers: typeof import("../../auth")["handlers"];
let passwordHash: string;
let role = "CUSTOMER";
const originalFindFirst = prisma.user.findFirst;
const originalFindUnique = prisma.user.findUnique;
before(async () => {
  process.env.AUTH_SECRET = "test-only-customer-login-secret";
  handlers = (await import("../../auth")).handlers;
  passwordHash = await hashPassword("test-customer-password");
});
beforeEach(() => {
  mock.restoreAll();
  role = "CUSTOMER";
  prisma.user.findFirst = (async () => ({ id: "test-customer", email: "customer@example.com", name: "Test Customer", role, passwordHash, tenantId: null })) as unknown as typeof prisma.user.findFirst;
  prisma.user.findUnique = (async () => ({ role: "CUSTOMER", staffStatus: "ACTIVE", forceLogoutBefore: null })) as unknown as typeof prisma.user.findUnique;
  mock.method(console, "error", () => {});
});
after(async () => {
  mock.restoreAll();
  prisma.user.findFirst = originalFindFirst;
  prisma.user.findUnique = originalFindUnique;
  if (originalSecret === undefined) delete process.env.AUTH_SECRET; else process.env.AUTH_SECRET = originalSecret;
  await prisma.$disconnect();
});
const base = "http://localhost:3001";
const cookieHeader = (response: Response) => response.headers.getSetCookie().map(cookie => cookie.split(";")[0]).join("; ");
async function login(password: string) {
  const csrf = await handlers.GET(new NextRequest(`${base}/api/auth/csrf`));
  const { csrfToken } = await csrf.json();
  return handlers.POST(new NextRequest(`${base}/api/auth/callback/customer-credentials`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Auth-Return-Redirect": "1", cookie: cookieHeader(csrf) },
    body: new URLSearchParams({ csrfToken, identifier: "customer@example.com", password, callbackUrl: `${base}/konto` }),
  }));
}

it("valid customer credentials create a persistent customer session", async () => {
  const response = await login("test-customer-password");
  assert.equal(new URL((await response.json()).url).searchParams.get("error"), null);
  const cookie = cookieHeader(response);
  assert.match(cookie, /authjs.session-token=/);
  for (let reload = 0; reload < 2; reload++) {
    const sessionResponse = await handlers.GET(new NextRequest(`${base}/api/auth/session`, { headers: { cookie } }));
    const session = await sessionResponse.json();
    assert.equal(session.user.role, "CUSTOMER");
    assert.equal(session.user.id, "test-customer");
  }
});

it("invalid passwords return CredentialsSignin without an authenticated cookie", async () => {
  const response = await login("wrong-password");
  assert.equal(new URL((await response.json()).url).searchParams.get("error"), "CredentialsSignin");
  assert.doesNotMatch(cookieHeader(response), /authjs.session-token=/);
});

it("the customer provider cannot authenticate staff credentials", async () => {
  role = "ADMIN";
  const response = await login("test-customer-password");
  assert.equal(new URL((await response.json()).url).searchParams.get("error"), "CredentialsSignin");
});
