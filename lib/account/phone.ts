/** Normalize Swedish phone numbers for lookup and storage. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("46") && digits.length >= 10) {
    return `+${digits}`;
  }
  if (digits.startsWith("0")) {
    return `+46${digits.slice(1)}`;
  }
  if (digits.length >= 9) {
    return `+${digits}`;
  }
  return digits;
}

export function phonesMatch(a: string, b: string): boolean {
  return normalizePhone(a) === normalizePhone(b);
}
