/** Encode/decode ESC/POS byte payloads for HTTP transport. */
export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Node-safe base64 decode (API routes). */
export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}
