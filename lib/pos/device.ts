/** Screen size breakpoints for POS hardware (ZQ-P108B and similar). */

export type PosScreenSize = "mobile" | "tablet" | "pos-terminal";

export const POS_BREAKPOINTS = {
  tablet: 768,
  terminal: 1024,
} as const;

export function getPosScreenSize(width: number): PosScreenSize {
  if (width < POS_BREAKPOINTS.tablet) return "mobile";
  if (width < POS_BREAKPOINTS.terminal) return "tablet";
  return "pos-terminal";
}

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function isFinePointer(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(pointer: fine)").matches;
}
