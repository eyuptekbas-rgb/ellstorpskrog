export const CATEGORY_EMOJI: Record<string, string> = {
  "vara-goda-pizzor": "🍕",
  smaratter: "🥖",
  "a-la-carte": "🍽️",
  plankstek: "🥩",
  "kebab-kyckling-falafel-gyros": "🥙",
  pastaratter: "🍝",
  hamburgare: "🍔",
  efterratt: "🍰",
  drycker: "🥤",
};

export function getCategoryEmoji(slug: string): string {
  return CATEGORY_EMOJI[slug] ?? "🍽️";
}

/** Singular item noun for each category, used in the count label. */
const CATEGORY_ITEM_NOUN: Record<string, { one: string; many: string }> = {
  "vara-goda-pizzor": { one: "pizza", many: "pizzor" },
  "a-la-carte": { one: "rätt", many: "rätter" },
  "kebab-kyckling-falafel-gyros": { one: "rätt", many: "rätter" },
  hamburgare: { one: "burgare", many: "burgare" },
  pastaratter: { one: "pasta", many: "pastarätter" },
  plankstek: { one: "rätt", many: "rätter" },
  smaratter: { one: "rätt", many: "smårätter" },
  efterratt: { one: "dessert", many: "desserter" },
  drycker: { one: "dryck", many: "drycker" },
};

export function getCategoryCountLabel(slug: string, count: number): string {
  const nouns = CATEGORY_ITEM_NOUN[slug] ?? { one: "rätt", many: "rätter" };
  return `${count} ${count === 1 ? nouns.one : nouns.many}`;
}
