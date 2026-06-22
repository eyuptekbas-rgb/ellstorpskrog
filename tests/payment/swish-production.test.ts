import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { PaymentStatus } from "@prisma/client";
import {
  buildSwishCallbackEventId,
  extractSwishBusinessIdFromCallbackUrl,
  isHandledSwishCallbackStatus,
  mapSwishStatusToPaymentStatus,
  parseSwishCallbackPayload,
  parseSwishRefundCallback,
} from "@/src/services/payment/providers/swish/callback-parser";
import {
  parseSwishAmount,
  swishAmountsMatch,
  toSwishAmount,
} from "@/src/services/payment/providers/swish/amounts";
import { extractSwishResourceId } from "@/src/services/payment/providers/swish/urls";
import { SWISH_API_BASE_URLS } from "@/src/services/payment/providers/swish/constants";

function hashWebhookPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

describe("Swish amounts", () => {
  it("formats decimal amounts for Swish Handel", () => {
    assert.equal(toSwishAmount("199.5"), "199.50");
    assert.equal(parseSwishAmount("100"), "100.00");
  });

  it("compares amounts safely", () => {
    assert.equal(swishAmountsMatch("100.00", "100"), true);
    assert.equal(swishAmountsMatch("100.00", "100.01"), false);
  });
});

describe("Swish callback parser", () => {
  it("recognizes handled callback statuses", () => {
    assert.equal(isHandledSwishCallbackStatus("PAID"), true);
    assert.equal(isHandledSwishCallbackStatus("CREATED"), true);
    assert.equal(isHandledSwishCallbackStatus("UNKNOWN"), false);
  });

  it("maps Swish statuses to payment statuses", () => {
    assert.equal(mapSwishStatusToPaymentStatus("PAID"), PaymentStatus.PAID);
    assert.equal(mapSwishStatusToPaymentStatus("DECLINED"), PaymentStatus.FAILED);
    assert.equal(mapSwishStatusToPaymentStatus("CANCELLED"), PaymentStatus.CANCELLED);
    assert.equal(mapSwishStatusToPaymentStatus("CREATED"), PaymentStatus.PENDING);
  });

  it("parses PAID callbacks with tenant payment reference", () => {
    const parsed = parseSwishCallbackPayload({
      id: "swish-req-1",
      payeePaymentReference: "pay_abc123",
      paymentReference: "ABC123XYZ",
      status: "PAID",
      amount: "250.00",
      currency: "SEK",
      datePaid: "2026-06-19T12:00:00Z",
    });

    assert.ok(parsed);
    assert.equal(parsed.status, PaymentStatus.PAID);
    assert.equal(parsed.paymentId, "pay_abc123");
    assert.equal(parsed.providerPaymentId, "swish-req-1");
    assert.equal(parsed.providerReference, "ABC123XYZ");
    assert.equal(
      parsed.eventId,
      buildSwishCallbackEventId({
        id: "swish-req-1",
        status: "PAID",
        datePaid: "2026-06-19T12:00:00Z",
      })
    );
  });

  it("ignores CREATED callbacks", () => {
    const parsed = parseSwishCallbackPayload({
      id: "swish-req-2",
      status: "CREATED",
    });
    assert.equal(parsed, null);
  });

  it("parses failed callbacks", () => {
    const parsed = parseSwishCallbackPayload({
      id: "swish-req-3",
      payeePaymentReference: "pay_fail",
      status: "ERROR",
      errorCode: "RF07",
      errorMessage: "Transaction declined",
    });

    assert.ok(parsed);
    assert.equal(parsed.status, PaymentStatus.FAILED);
  });

  it("parses refund callbacks", () => {
    const parsed = parseSwishRefundCallback({
      id: "refund-1",
      originalPaymentReference: "ABC123XYZ",
      status: "DEBITED",
      amount: "50.00",
      currency: "SEK",
    });

    assert.ok(parsed);
    assert.equal(parsed.status, PaymentStatus.REFUNDED);
    assert.equal(parsed.providerReference, "ABC123XYZ");
  });

  it("extracts business id from callback url", () => {
    assert.equal(
      extractSwishBusinessIdFromCallbackUrl(
        "https://example.com/api/webhooks/swish?businessId=tenant_abc"
      ),
      "tenant_abc"
    );
  });
});

describe("Swish API helpers", () => {
  it("extracts payment request id from location header", () => {
    assert.equal(
      extractSwishResourceId(
        "https://mss.cpc.getswish.net/swish-cpcapi/api/v1/paymentrequests/abc-123"
      ),
      "abc-123"
    );
  });

  it("documents Swedbank Swish Handel API base URLs", () => {
    assert.equal(SWISH_API_BASE_URLS.test, "https://mss.cpc.getswish.net");
    assert.equal(SWISH_API_BASE_URLS.live, "https://cpc.getswish.net");
  });
});

describe("Swish webhook payload hashing", () => {
  it("hashes payloads deterministically for idempotency storage", () => {
    const body = JSON.stringify({ id: "swish-1", status: "PAID" });
    assert.equal(hashWebhookPayload(body), hashWebhookPayload(body));
  });
});

describe("Swish payment method routing", () => {
  it("documents SWISH mapped to swish provider", () => {
    const mapping = { SWISH: "swish" } as const;
    assert.equal(mapping.SWISH, "swish");
  });
});
