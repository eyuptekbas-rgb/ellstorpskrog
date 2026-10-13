import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { selectFiveStarReviews } from "../../lib/home/google-review-data";
import { createGoogleReviewLoader } from "../../lib/home/google-reviews";

// Synthetic test fixtures only. Never imported by the application.
const review = (id: string, starRating = "FIVE", comment = `Fixture text ${id}`) => ({ reviewId: id, starRating, comment, reviewer: { displayName: `Fixture author ${id}` }, updateTime: `2026-08-${id.padStart(2, "0")}T12:00:00Z` });
const config = { clientId: "test-client", clientSecret: "test-secret", refreshToken: "test-token", location: "accounts/123/locations/456" };

describe("Google five-star review selection", () => {
  it("keeps only exact FIVE ratings with named written reviews, newest first, max three", () => {
    const result = selectFiveStarReviews([review("1"), review("2", "FOUR"), review("3", "FIVE", " "), review("4"), review("5"), review("6"), review("7", "5"), review("8", "RATING_UNSPECIFIED"), { ...review("9"), reviewer: {} }, ...["ONE", "TWO", "THREE"].map(r => review("10", r))]);
    assert.deepEqual(result.map(r => r.id), ["6", "5", "4"]);
    assert.ok(result.every(r => r.rating === 5));
    assert.equal(result[0].name, "Fixture author 6");
    assert.equal(result[0].text, "Fixture text 6");
  });
  it("deduplicates IDs and normalized text without rewriting displayed content", () => {
    const result = selectFiveStarReviews([review("1"), review("1"), review("2", "FIVE", "  FIXTURE text 1  ")]);
    assert.equal(result.length, 1);
    assert.equal(result[0].text, "  FIXTURE text 1  ");
  });
});

describe("Google review fetch and cache", () => {
  it("uses the authorized Google endpoint, deduplicates concurrent loads and refreshes after an hour", async () => {
    let calls = 0; let now = 0;
    const fetcher: typeof fetch = async (url, init) => {
      calls++;
      assert.equal(init?.cache, "no-store");
      if (String(url).includes("oauth2")) return Response.json({ access_token: "test-access" });
      assert.match(String(url), /^https:\/\/mybusiness.googleapis.com\/v4\/accounts\/123\/locations\/456\/reviews/);
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-access");
      return Response.json({ reviews: [review("1"), review("2"), review("3")] });
    };
    const load = createGoogleReviewLoader(fetcher, () => now);
    const [first, second] = await Promise.all([load(config), load(config)]);
    assert.deepEqual(first, second); assert.equal(calls, 2);
    await load(config); assert.equal(calls, 2);
    now = 3600001; await load(config); assert.equal(calls, 4);
    assert.ok(!JSON.stringify(first).includes("test-secret"));
  });
  it("paginates when the recent page lacks qualifying reviews", async () => {
    let page = 0;
    const load = createGoogleReviewLoader(async url => {
      if (String(url).includes("oauth2")) return Response.json({ access_token: "test" });
      return Response.json(++page === 1 ? { reviews: [review("1", "FOUR")], nextPageToken: "next" } : { reviews: [review("2")] });
    });
    assert.equal((await load(config))[0].id, "2"); assert.equal(page, 2);
  });
  it("returns no fake data for missing config, errors or malformed responses, and backs off", async () => {
    let calls = 0;
    const load = createGoogleReviewLoader(async () => { calls++; return Response.json({}, { status: 503 }); });
    assert.deepEqual(await load(null), []); assert.equal(calls, 0);
    assert.deepEqual(await load(config), []);
    assert.deepEqual(await load(config), []); assert.equal(calls, 1);
    const malformed = createGoogleReviewLoader(async () => Response.json({}));
    assert.deepEqual(await malformed(config), []);
  });
});
