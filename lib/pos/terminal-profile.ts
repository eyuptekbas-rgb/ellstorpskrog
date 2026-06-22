/** ZQ-P108B and similar 15" POS terminal profile detection. */

export type PosTerminalProfile = {
  id: "zq-p108b" | "generic-pos" | "desktop";
  label: string;
  width: number;
  height: number;
  landscape: boolean;
  touchOptimized: boolean;
  autoFullscreen: boolean;
};

export const ZQ_P108B_RESOLUTIONS = [
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
] as const;

const PROFILE_TOLERANCE = 48;

export function detectPosTerminalProfile(
  width: number,
  height: number
): PosTerminalProfile {
  const landscape = width >= height;
  const w = landscape ? width : height;
  const h = landscape ? height : width;

  for (const res of ZQ_P108B_RESOLUTIONS) {
    if (
      Math.abs(w - res.width) <= PROFILE_TOLERANCE &&
      Math.abs(h - res.height) <= PROFILE_TOLERANCE
    ) {
      return {
        id: "zq-p108b",
        label: "ZQ-P108B",
        width: w,
        height: h,
        landscape: true,
        touchOptimized: true,
        autoFullscreen: true,
      };
    }
  }

  if (w >= 1024 && landscape) {
    return {
      id: "generic-pos",
      label: "POS Terminal",
      width: w,
      height: h,
      landscape,
      touchOptimized: true,
      autoFullscreen: true,
    };
  }

  return {
    id: "desktop",
    label: "Desktop",
    width,
    height,
    landscape,
    touchOptimized: false,
    autoFullscreen: false,
  };
}

export function isPosTerminalProfile(profile: PosTerminalProfile): boolean {
  return profile.id === "zq-p108b" || profile.id === "generic-pos";
}
