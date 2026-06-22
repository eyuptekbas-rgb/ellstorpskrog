/** ESC/POS command bytes for thermal printers (58/80mm). */

import { encodeCp850 } from "./text-encoding";

export const ESC = 0x1b;
export const GS = 0x1d;
export const LF = 0x0a;
export const FS = 0x1c;

/** Initialize printer */
export const CMD_INIT = new Uint8Array([ESC, 0x40]);

/** Full cut */
export const CMD_CUT = new Uint8Array([GS, 0x56, 0x00]);

/** Partial cut */
export const CMD_PARTIAL_CUT = new Uint8Array([GS, 0x56, 0x01]);

/** Open cash drawer — pin 2 */
export const CMD_DRAWER_KICK = new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xfa]);

/** Select character code table — PC850 (Latin-1) */
export const CMD_CHARSET = new Uint8Array([ESC, 0x74, 0x02]);

export const CMD_ALIGN_LEFT = new Uint8Array([ESC, 0x61, 0x00]);
export const CMD_ALIGN_CENTER = new Uint8Array([ESC, 0x61, 0x01]);
export const CMD_ALIGN_RIGHT = new Uint8Array([ESC, 0x61, 0x02]);

/** Transmit printer status — DLE EOT n */
export const CMD_STATUS_PAPER = new Uint8Array([0x10, 0x04, 0x01]);
export const CMD_STATUS_ERROR = new Uint8Array([0x10, 0x04, 0x03]);
export const CMD_STATUS_BUSY = new Uint8Array([0x10, 0x04, 0x02]);

export function cmdBold(on: boolean): Uint8Array {
  return new Uint8Array([ESC, 0x45, on ? 0x01 : 0x00]);
}

export function cmdUnderline(mode: 0 | 1 | 2): Uint8Array {
  return new Uint8Array([ESC, 0x2d, mode]);
}

/** n bits: 0 normal, 16 double height, 32 double width, 48 both */
export function cmdFontSize(n: number): Uint8Array {
  return new Uint8Array([GS, 0x21, n & 0xff]);
}

export function cmdDoubleHeight(on: boolean): Uint8Array {
  return cmdFontSize(on ? 0x10 : 0x00);
}

export function cmdDoubleWidth(on: boolean): Uint8Array {
  return cmdFontSize(on ? 0x20 : 0x00);
}

export function cmdDoubleSize(on: boolean): Uint8Array {
  return cmdFontSize(on ? 0x30 : 0x00);
}

export function cmdFont(font: 0 | 1): Uint8Array {
  return new Uint8Array([ESC, 0x4d, font]);
}

/** Set line spacing in dots (default is 32). */
export function cmdLineSpacing(dots: number): Uint8Array {
  return new Uint8Array([ESC, 0x33, dots & 0xff]);
}

/** Restore default line spacing. */
export function cmdDefaultLineSpacing(): Uint8Array {
  return new Uint8Array([ESC, 0x32]);
}

/**
 * Print density — darkness 0–255, print speed 2–250.
 * Lower speed yields sharper thermal output on many Epson clones.
 */
export function cmdPrintDensity(darkness = 180, speed = 2): Uint8Array {
  return new Uint8Array([ESC, 0x37, darkness & 0xff, speed & 0xff, 0]);
}

/** White-on-black (reverse) print mode. */
export function cmdReverse(on: boolean): Uint8Array {
  return new Uint8Array([ESC, 0x7b, on ? 0x01 : 0x00]);
}

/** Print buffer and feed paper n dots (tighter than a full line). */
export function cmdFeedDots(dots: number): Uint8Array {
  return new Uint8Array([ESC, 0x4a, dots & 0xff]);
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function textToBytes(text: string): Uint8Array {
  return encodeCp850(text);
}

/** Encode QR code using GS ( k model 2. */
export function cmdQrCode(data: string, moduleSize = 6): Uint8Array {
  const payload = new TextEncoder().encode(data);
  const storeLen = payload.length + 3;
  const pL = storeLen % 256;
  const pH = Math.floor(storeLen / 256);

  return concatBytes(
    new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize]),
    new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]),
    new Uint8Array([GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]),
    payload,
    new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30])
  );
}

export type MonochromeBitmap = {
  width: number;
  height: number;
  /** 1-bit packed raster, row-major, MSB first. */
  data: Uint8Array;
};

/** Print raster bitmap (GS v 0). */
export function cmdBitmap(bitmap: MonochromeBitmap): Uint8Array {
  const { width, height, data } = bitmap;
  const bytesPerRow = Math.ceil(width / 8);
  const xL = bytesPerRow % 256;
  const xH = Math.floor(bytesPerRow / 256);
  const yL = height % 256;
  const yH = Math.floor(height / 256);

  return concatBytes(
    CMD_ALIGN_CENTER,
    new Uint8Array([GS, 0x76, 0x30, 0x00, xL, xH, yL, yH]),
    data,
    new Uint8Array([LF])
  );
}

/** Build a simple text-based logo bitmap from restaurant initials. */
export function textLogoBitmap(text: string, width = 384): MonochromeBitmap {
  const label = text.slice(0, 2).toUpperCase();
  const height = 48;
  const bytesPerRow = Math.ceil(width / 8);
  const data = new Uint8Array(bytesPerRow * height);
  const hash = label.charCodeAt(0) + (label.charCodeAt(1) ?? 0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pattern =
        ((x * 7 + y * 13 + hash) % 17 === 0) ||
        (y > 8 && y < height - 8 && x > 40 && x < width - 40 && y % 12 === 0);
      if (pattern) {
        const byteIndex = y * bytesPerRow + Math.floor(x / 8);
        data[byteIndex] |= 0x80 >> (x % 8);
      }
    }
  }

  return { width, height, data };
}
