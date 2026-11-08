import assert from "node:assert/strict";
import { after, before, it } from "node:test";
import { NextRequest, type NextFetchEvent } from "next/server";
import { encode } from "next-auth/jwt";

const originalSecret = process.env.AUTH_SECRET;
const secret = "test-only-local-account-routing-secret-not-a-real-key";
let middleware: (request: NextRequest, event: NextFetchEvent) => Promise<Response>;
before(async () => {
  process.env.AUTH_SECRET = secret;
  middleware = (await import("../../middleware")).default as unknown as typeof middleware;
});
after(() => {
  if (originalSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = originalSecret;
});

it("desktop account destination redirects logged-out visitors to customer login", async () => {
  const response = await middleware(new NextRequest("http://localhost:3001/konto"), {} as NextFetchEvent);
  assert.equal(response.headers.get("location"), "http://localhost:3001/konto/logga-in");
});

it("desktop account destination accepts an authenticated customer session", async () => {
  const cookieName = "authjs.session-token";
  const token = await encode({ secret, salt: cookieName, token: { sub: "test-customer", id: "test-customer", role: "CUSTOMER" } });
  const response = await middleware(new NextRequest("http://localhost:3001/konto", { headers: { cookie: `${cookieName}=${token}`, host: "localhost:3001", "x-forwarded-proto": "http" } }), {} as NextFetchEvent);
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.headers.get("x-middleware-next"), "1");
  const loginResponse = await middleware(new NextRequest("http://localhost:3001/konto/logga-in", { headers: { cookie: `${cookieName}=${token}`, host: "localhost:3001", "x-forwarded-proto": "http" } }), {} as NextFetchEvent);
  assert.equal(loginResponse.headers.get("location"), "http://localhost:3001/konto");
});
