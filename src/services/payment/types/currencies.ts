export const ISO_4217_CURRENCIES = [
  "SEK",
  "EUR",
  "USD",
  "DKK",
  "NOK",
  "GBP",
  "CHF",
  "PLN",
  "CZK",
  "ISK",
] as const;

export type Iso4217Currency = (typeof ISO_4217_CURRENCIES)[number];

const CURRENCY_SET = new Set<string>(ISO_4217_CURRENCIES);

export function isIso4217Currency(value: string): value is Iso4217Currency {
  return CURRENCY_SET.has(value);
}
