// Server-only data source: import only from the homepage server component.
import { selectFiveStarReviews, type GoogleReview } from "./google-review-data";

type Config = { clientId: string; clientSecret: string; refreshToken: string; location: string };
const TTL = 60 * 60 * 1000;
const FAILURE_TTL = 5 * 60 * 1000;

export function createGoogleReviewLoader(fetcher: typeof fetch = fetch, now = Date.now) {
  let cached: GoogleReview[] = [];
  let expires = 0;
  let cacheKey = "";
  let pending: Promise<GoogleReview[]> | undefined;

  return async (config: Config | null): Promise<GoogleReview[]> => {
    if (!config || !/^accounts\/\d+\/locations\/\d+$/.test(config.location)) return [];
    const key = JSON.stringify(config);
    if (key !== cacheKey) {
      cacheKey = key;
      cached = [];
      expires = 0;
      pending = undefined;
    }
    if (expires > now()) return cached;
    if (pending) return pending;
    pending = (async () => {
      try {
        const signal = AbortSignal.timeout(3000);
        const tokenResponse = await fetcher("https://oauth2.googleapis.com/token", {
          method: "POST", cache: "no-store", signal,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret,
            refresh_token: config.refreshToken, grant_type: "refresh_token" }),
        });
        if (!tokenResponse.ok) throw new Error("Google authorization unavailable");
        const token = await tokenResponse.json();
        if (typeof token.access_token !== "string" || !token.access_token) throw new Error("Missing access token");
        const reviews: unknown[] = [];
        let pageToken = "";
        // Bound work to the most recent 150 reviews and a total three-second deadline.
        for (let page = 0; page < 3; page++) {
          const url = new URL(`https://mybusiness.googleapis.com/v4/${config.location}/reviews`);
          url.searchParams.set("pageSize", "50");
          url.searchParams.set("orderBy", "updateTime desc");
          if (pageToken) url.searchParams.set("pageToken", pageToken);
          const response = await fetcher(url, { cache: "no-store", signal,
            headers: { Authorization: `Bearer ${token.access_token}` } });
          if (!response.ok) throw new Error("Google reviews unavailable");
          const body = await response.json();
          if (!Array.isArray(body.reviews)) throw new Error("Invalid Google response");
          reviews.push(...body.reviews);
          pageToken = typeof body.nextPageToken === "string" ? body.nextPageToken : "";
          if (selectFiveStarReviews(reviews).length === 3 || !pageToken) break;
        }
        const selected = selectFiveStarReviews(reviews);
        if (key === cacheKey) { cached = selected; expires = now() + TTL; }
        return selected;
      } catch {
        // Never log OAuth secrets, raw responses or private reviewer profile data.
        if (key === cacheKey) { cached = []; expires = now() + FAILURE_TTL; }
        return [];
      } finally {
        if (key === cacheKey) pending = undefined;
      }
    })();
    return pending;
  };
}

const load = createGoogleReviewLoader();
export async function getGoogleReviews() {
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_BUSINESS_REFRESH_TOKEN;
  const location = process.env.GOOGLE_BUSINESS_LOCATION;
  return load(clientId && clientSecret && refreshToken && location
    ? { clientId, clientSecret, refreshToken, location } : null);
}

export function getGoogleReviewsUrl() {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", "Ellstorps Kvarterskrog Sallerupsvägen 28D Malmö");
  if (process.env.GOOGLE_MAPS_PLACE_ID) url.searchParams.set("query_place_id", process.env.GOOGLE_MAPS_PLACE_ID);
  return url.toString();
}
