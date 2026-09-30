export type GoogleReview = { id: string; name: string; text: string; rating: 5; date: string };
type BusinessReview = {
  reviewId?: unknown;
  starRating?: unknown;
  comment?: unknown;
  createTime?: unknown;
  updateTime?: unknown;
  reviewer?: { displayName?: unknown; isAnonymous?: unknown };
};

export function selectFiveStarReviews(data: unknown): GoogleReview[] {
  if (!Array.isArray(data)) return [];
  const candidates = data.flatMap((value): GoogleReview[] => {
    if (!value || typeof value !== "object") return [];
    const review = value as BusinessReview;
    // Google's Business Profile API uses the FIVE enum, not a numeric rating.
    const rating = review.starRating === "FIVE" ? 5 : null;
    if (rating !== 5 || typeof review.reviewId !== "string" || !review.reviewId ||
        typeof review.comment !== "string" || !review.comment.trim() ||
        typeof review.reviewer?.displayName !== "string" || !review.reviewer.displayName.trim() ||
        review.reviewer.isAnonymous === true) return [];
    const date = typeof review.updateTime === "string" ? review.updateTime :
      typeof review.createTime === "string" ? review.createTime : "";
    return [{ id: review.reviewId, name: review.reviewer.displayName, text: review.comment, rating, date }];
  });
  candidates.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
  const ids = new Set<string>();
  const texts = new Set<string>();
  return candidates.filter(review => {
    const normalizedText = review.text.trim().replace(/\s+/g, " ").toLocaleLowerCase("sv");
    if (ids.has(review.id) || texts.has(normalizedText)) return false;
    ids.add(review.id);
    texts.add(normalizedText);
    return true;
  }).slice(0, 3);
}
