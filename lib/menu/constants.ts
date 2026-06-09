export const CATEGORY_EMOJI: Record<string, string> = {
  pizza: "🍕",
  kebab: "🥙",
  burgare: "🍔",
  grill: "🥩",
  drycker: "🥤",
};

export function getCategoryEmoji(slug: string): string {
  return CATEGORY_EMOJI[slug] ?? "🍽️";
}
