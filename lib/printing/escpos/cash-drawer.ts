import { CMD_DRAWER_KICK } from "./commands";

/** Encode cash drawer kick pulse (ESC p). */
export function encodeCashDrawerKick(): Uint8Array {
  return CMD_DRAWER_KICK;
}
