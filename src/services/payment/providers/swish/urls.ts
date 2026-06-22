export function extractSwishResourceId(location: string | undefined): string | null {
  if (!location) return null;

  const trimmed = location.trim();
  const segments = trimmed.split("/").filter(Boolean);
  return segments.at(-1) ?? null;
}
