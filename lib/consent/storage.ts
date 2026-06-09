"use client";

import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  type ConsentCategories,
  type ConsentRecord,
} from "@/lib/consent/types";

export function loadConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(categories: ConsentCategories): ConsentRecord {
  const record: ConsentRecord = {
    ...categories,
    necessary: true,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function clearConsent(): void {
  localStorage.removeItem(CONSENT_STORAGE_KEY);
}
