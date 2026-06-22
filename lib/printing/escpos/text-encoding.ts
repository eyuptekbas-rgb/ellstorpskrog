/**
 * PC850 (Latin-1) bytes for ESC/POS — matches CMD_CHARSET (ESC t 2).
 * Thermal printers expect single-byte code pages, not UTF-8.
 */
const CP850 =
  "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈıÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ ";

const UNICODE_TO_CP850 = new Map<string, number>();
for (let i = 0; i < CP850.length; i++) {
  UNICODE_TO_CP850.set(CP850[i]!, 0x80 + i);
}

function foldToAscii(char: string): string {
  return char.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Encode printable text for thermal printers using PC850. */
export function encodeCp850(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code === 0x0a || code === 0x0d || code === 0x09) {
      bytes.push(code);
      continue;
    }
    if (code >= 0x20 && code <= 0x7e) {
      bytes.push(code);
      continue;
    }
    const mapped = UNICODE_TO_CP850.get(char);
    if (mapped !== undefined) {
      bytes.push(mapped);
      continue;
    }
    const folded = foldToAscii(char);
    const foldedMapped = UNICODE_TO_CP850.get(folded);
    if (foldedMapped !== undefined) {
      bytes.push(foldedMapped);
      continue;
    }
    if (folded.length === 1) {
      const foldedCode = folded.charCodeAt(0);
      if (foldedCode >= 0x20 && foldedCode <= 0x7e) {
        bytes.push(foldedCode);
        continue;
      }
    }
    bytes.push(0x3f);
  }
  return new Uint8Array(bytes);
}

/** Decode PC850 bytes to a JavaScript string (tests / debugging). */
export function decodeCp850(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) {
    if (byte === 0x0a || byte === 0x0d) {
      out += String.fromCharCode(byte);
    } else if (byte >= 0x20 && byte <= 0x7e) {
      out += String.fromCharCode(byte);
    } else if (byte >= 0x80 && byte < 0x80 + CP850.length) {
      out += CP850[byte - 0x80]!;
    }
  }
  return out;
}
