import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';
import { chromium } from 'playwright';

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
assert.ok(['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname));
const base = process.env.POS_TEST_URL || 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1', '192.168.1.39'].includes(new URL(base).hostname));
const db = new PrismaClient();
const tenant = await db.tenant.create({ data: { slug: `pos-check-${randomUUID()}`, name: 'POS verification' } });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext();
  const cookie = 'authjs.session-token';
  const token = await encode({ secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET, salt: cookie,
    token: { id: 'pos-local-verification', role: 'ADMIN', tenantId: tenant.id }, maxAge: 600 });
  await context.addCookies([{ name: cookie, value: token, url: base }]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().includes('/api/')) console.log('HTTP', response.status(), new URL(response.url()).pathname); });
  let firstFetch = true;
  await page.route('**/api/orders?*', async route => {
    if (firstFetch) {
      firstFetch = false;
      return route.fulfill({ status: 503, json: { error: 'Temporary test outage' } });
    }
    await new Promise(resolve => setTimeout(resolve, 4500));
    await route.continue();
  });
  await page.goto(`${base}/pos`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  console.log('POS initial', page.url(), (await page.locator('body').innerText()).slice(0,1500));
  const order = await db.order.create({ data: { tenantId: tenant.id, orderNumber: `POS-${randomUUID().slice(0,8)}`,
    customerName: 'POS Browser Test', customerEmail: '', customerPhone: '0701234567',
    orderType: 'PICKUP', paymentMethod: 'ON_PICKUP', total: 199 } });
  await page.getByText('POS Browser Test', { exact: true }).first().waitFor({ timeout: 25000 });
  console.log('PASS: new order reaches mounted POS through polling');
  console.log('PASS: recovers from initial API failure and responses slower than polling interval');
  await page.evaluate(() => {
    window.posTestEvents = [];
    window.posTestStream = new EventSource('/api/realtime/stream');
    window.posTestStream.addEventListener('OrderUpdated', event => window.posTestEvents.push(JSON.parse(event.data)));
  });
  await page.waitForFunction(() => window.posTestStream.readyState === EventSource.OPEN);
  const split = await context.request.post(`${base}/api/admin/pos/split-payment`, { data: { orderId: order.id,
    lines: [{ method: 'ON_PICKUP', amount: '99.00' }, { method: 'CARD', amount: '100.00' }] } });
  assert.equal(split.status(), 200, await split.text());
  assert.equal((await db.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus, 'PAID');
  console.log('PASS: authenticated split payment');
  await page.waitForFunction(() => window.posTestEvents.length > 0);
  console.log('PASS: actual SSE receives split payment event');
  for (const status of ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']) {
    const response = await context.request.put(`${base}/api/orders/${order.id}/status`, { data: { status } });
    assert.equal(response.status(), 200, await response.text());
    assert.equal((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status, status);
  }
  console.log('PASS: authenticated complete POS status workflow');
  await page.evaluate(() => window.posTestStream.close());
  assert.deepEqual(errors, []);
  console.log('PASS: no browser runtime errors');
} finally {
  await browser.close();
  await db.tenant.delete({ where: { id: tenant.id } });
  await db.$disconnect();
}
