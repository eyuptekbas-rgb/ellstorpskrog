import assert from "node:assert/strict";
import { after, beforeEach, describe, it, mock } from "node:test";
import { POST } from "../../app/api/contact/route";
import { getResendClient } from "../../lib/email/resend";
import { getPublicFormEmailConfig } from "../../lib/email/public-forms";
import { saveAndNotifyReservation } from "../../lib/reservations/submit";
import { validateReservationInput } from "../../lib/reservations";

const keys = ["RESEND_API_KEY", "CONTACT_TO_EMAIL", "RESERVATION_TO_EMAIL"] as const;
const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
let calls: Array<{ to: string[]; html: string; replyTo: string }> = [];
let deliveryError = false;
let thrownError = false;
let requestId = 0;
const booking = { name: "Test <Guest>", email: "guest@example.com", phone: "0700000000", date: "2099-06-20", time: "18:00", guestCount: 4, comment: "Test notes\nNo nuts <script>" };
const contactRequest = (data: unknown) => new Request("http://localhost/api/contact", { method: "POST", headers: { "x-forwarded-for": `test-${++requestId}` }, body: JSON.stringify(data) });

beforeEach(() => {
  mock.restoreAll();
  process.env.RESEND_API_KEY = "re_test_never_sent";
  delete process.env.CONTACT_TO_EMAIL;
  delete process.env.RESERVATION_TO_EMAIL;
  calls = []; deliveryError = false; thrownError = false;
  // Mock the SDK before any send. Tests never invoke a real network transport.
  mock.method(getResendClient()!.emails, "send", async (message: typeof calls[number]) => {
    calls.push(message);
    if (thrownError) throw new Error("Mock transport failure");
    return deliveryError ? { data: null, error: { message: "Mock rejection" } } : { data: { id: "mock-id" }, error: null };
  });
  mock.method(console, "error", () => {});
});
after(() => {
  mock.restoreAll();
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key]; else process.env[key] = original[key];
  }
});

describe("contact recipient and response", () => {
  it("sends all fields to info only, escapes HTML, and returns success", async () => {
    const response = await POST(contactRequest({ name: "Test <Name>", email: "test@example.com", message: "Hello\n<script>" }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
    assert.deepEqual(calls[0].to, ["info@ellstorpskrog.se"]);
    assert.equal(calls[0].replyTo, "test@example.com");
    assert.match(calls[0].html, /Test &lt;Name&gt;/);
    assert.match(calls[0].html, /Hello<br\/>&lt;script&gt;/);
  });
  it("rejects empty, malformed and missing fields without sending", async () => {
    for (const body of [{}, null, { name: 42, email: "a", message: "x" }, { name: " ", email: "a@b.se", message: "x" }, { name: "test", email: "bad-email", message: "x" }]) {
      assert.equal((await POST(contactRequest(body))).status, 400);
    }
    assert.equal(calls.length, 0);
  });
  it("returns 500 on Resend returned errors and transport exceptions", async () => {
    const data = { name: "test", email: "test@example.com", message: "test" };
    deliveryError = true;
    assert.equal((await POST(contactRequest(data))).status, 500);
    deliveryError = false; thrownError = true;
    assert.equal((await POST(contactRequest(data))).status, 500);
  });
  it("fails closed for swapped recipients and missing credentials", async () => {
    process.env.CONTACT_TO_EMAIL = "reservation@ellstorpskrog.se";
    assert.equal((await POST(contactRequest({ name: "test", email: "test@example.com", message: "test" }))).status, 503);
    process.env.RESERVATION_TO_EMAIL = "info@ellstorpskrog.se";
    assert.throws(() => getPublicFormEmailConfig("reservation"));
    delete process.env.CONTACT_TO_EMAIL;
    delete process.env.RESEND_API_KEY;
    assert.equal((await POST(contactRequest({ name: "test", email: "test@example.com", message: "test" }))).status, 503);
    assert.equal(calls.length, 0);
  });
});

describe("reservation notifications", () => {
  it("validates required data, email, guests, date and time", () => {
    assert.equal(validateReservationInput(booking).ok, true);
    for (const change of [{ name: "" }, { phone: "" }, { email: "bad" }, { guestCount: 0 }, { guestCount: 51 }, { date: "2000-01-01" }, { time: "03:00" }]) {
      assert.equal(validateReservationInput({ ...booking, ...change }).ok, false);
    }
  });
  it("saves once and sends all fields only to reservation inbox", async () => {
    let saves = 0;
    const result = await saveAndNotifyReservation(booking, async () => { saves++; return { id: "test-booking", ...booking }; });
    assert.equal(saves, 1);
    assert.equal(result.emailNotificationSent, true);
    assert.deepEqual(calls[0].to, ["reservation@ellstorpskrog.se"]);
    for (const text of ["Test &lt;Guest&gt;", booking.email, booking.phone, booking.date, booking.time, "4", "No nuts &lt;script&gt;", "test-booking"]) assert.ok(calls[0].html.includes(text));
  });
  it("does not send on a database failure", async () => {
    await assert.rejects(saveAndNotifyReservation(booking, async () => { throw new Error("Mock database failure"); }));
    assert.equal(calls.length, 0);
  });
  it("does not save when recipient configuration is swapped", async () => {
    process.env.RESERVATION_TO_EMAIL = "info@ellstorpskrog.se";
    let saved = false;
    await assert.rejects(saveAndNotifyReservation(booking, async () => { saved = true; return { id: "test" }; }));
    assert.equal(saved, false);
    assert.equal(calls.length, 0);
  });
  it("keeps saved booking on delivery failure and flags notification failure", async () => {
    deliveryError = true;
    const result = await saveAndNotifyReservation(booking, async () => ({ id: "saved-booking" }));
    assert.equal(result.id, "saved-booking");
    assert.equal(result.emailNotificationSent, false);
  });
});
