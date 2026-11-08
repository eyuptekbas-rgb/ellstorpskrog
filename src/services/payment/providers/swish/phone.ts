export function normalizeSwishPhone(phone: string): string {
  let value = phone.replace(/[\s()-]/g, "").replace(/^\+/, "").replace(/^00/, "");
  if (value.startsWith("07")) value = `46${value.slice(1)}`;
  if (!/^467\d{8}$/.test(value)) throw new Error("Ange ett svenskt mobilnummer kopplat till Swish, till exempel 0701234567.");
  return value;
}
