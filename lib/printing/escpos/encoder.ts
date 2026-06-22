import {
  CMD_ALIGN_CENTER,
  CMD_ALIGN_LEFT,
  CMD_ALIGN_RIGHT,
  CMD_CHARSET,
  CMD_CUT,
  CMD_INIT,
  LF,
  cmdBitmap,
  cmdBold,
  cmdDefaultLineSpacing,
  cmdDoubleSize,
  cmdFeedDots,
  cmdFont,
  cmdFontSize,
  cmdLineSpacing,
  cmdPrintDensity,
  cmdQrCode,
  cmdReverse,
  cmdUnderline,
  concatBytes,
  textToBytes,
  type MonochromeBitmap,
} from "./commands";

export type EscPosEncoderOptions = {
  charset?: boolean;
  cut?: boolean;
  lineWidth?: number;
  /** Apply darker thermal output and Font A for sharper text. */
  sharpPrint?: boolean;
};

const DEFAULT_LINE_WIDTH = 42;

export class EscPosEncoder {
  private parts: Uint8Array[] = [];
  private lineWidth: number;

  constructor(options: EscPosEncoderOptions = {}) {
    this.lineWidth = options.lineWidth ?? DEFAULT_LINE_WIDTH;
    this.parts.push(CMD_INIT);
    if (options.sharpPrint !== false) {
      this.parts.push(cmdPrintDensity(190, 2));
      this.parts.push(cmdFont(0));
      this.parts.push(cmdLineSpacing(32));
    }
    if (options.charset !== false) {
      this.parts.push(CMD_CHARSET);
    }
    this.cutEnabled = options.cut !== false;
  }

  private cutEnabled = true;

  raw(bytes: Uint8Array): this {
    this.parts.push(bytes);
    return this;
  }

  align(mode: "left" | "center" | "right"): this {
    if (mode === "center") this.parts.push(CMD_ALIGN_CENTER);
    else if (mode === "right") this.parts.push(CMD_ALIGN_RIGHT);
    else this.parts.push(CMD_ALIGN_LEFT);
    return this;
  }

  bold(on = true): this {
    this.parts.push(cmdBold(on));
    return this;
  }

  underline(on = true): this {
    this.parts.push(cmdUnderline(on ? 1 : 0));
    return this;
  }

  size(mode: "normal" | "medium" | "large" | "xlarge"): this {
    if (mode === "xlarge") this.parts.push(cmdDoubleSize(true));
    else if (mode === "large") this.parts.push(cmdFontSize(0x10));
    else if (mode === "medium") this.parts.push(cmdFontSize(0x20));
    else this.parts.push(cmdFontSize(0x00));
    return this;
  }

  fontA(): this {
    this.parts.push(cmdFont(0));
    return this;
  }

  lineSpacing(dots: number): this {
    this.parts.push(cmdLineSpacing(dots));
    return this;
  }

  defaultLineSpacing(): this {
    this.parts.push(cmdDefaultLineSpacing());
    return this;
  }

  density(darkness = 190, speed = 2): this {
    this.parts.push(cmdPrintDensity(darkness, speed));
    return this;
  }

  line(text = ""): this {
    this.parts.push(textToBytes(text));
    this.parts.push(new Uint8Array([LF]));
    return this;
  }

  /** Print text then advance feedDots (default ~half line) instead of a full line feed. */
  lineFeedDots(text: string, feedDots = 14): this {
    this.parts.push(textToBytes(text));
    this.parts.push(cmdFeedDots(feedDots));
    return this;
  }

  blank(count = 1): this {
    for (let i = 0; i < count; i++) this.line("");
    return this;
  }

  rule(char = "-"): this {
    return this.line(char.repeat(this.lineWidth));
  }

  columns(left: string, right: string): this {
    const maxLeft = this.lineWidth - right.length - 1;
    const trimmedLeft = left.length > maxLeft ? `${left.slice(0, maxLeft - 1)}…` : left;
    const pad = Math.max(1, this.lineWidth - trimmedLeft.length - right.length);
    return this.line(`${trimmedLeft}${" ".repeat(pad)}${right}`);
  }

  bitmap(bitmap: MonochromeBitmap): this {
    this.parts.push(cmdBitmap(bitmap));
    return this;
  }

  reverse(on = true): this {
    this.parts.push(cmdReverse(on));
    return this;
  }

  /** Print mixed-style segments on a single line (e.g. black label + normal text). */
  lineSegments(
    segments: { text: string; reverse?: boolean; bold?: boolean }[]
  ): this {
    for (const segment of segments) {
      if (segment.reverse) this.parts.push(cmdReverse(true));
      if (segment.bold) this.parts.push(cmdBold(true));
      this.parts.push(textToBytes(segment.text));
      if (segment.bold) this.parts.push(cmdBold(false));
      if (segment.reverse) this.parts.push(cmdReverse(false));
    }
    this.parts.push(new Uint8Array([LF]));
    return this;
  }

  /** Thick separator for totals. */
  ruleThick(char = "="): this {
    this.rule(char);
    return this;
  }

  /** Compact black price/tag label with minimal padding. */
  blackLabel(text: string, align: "left" | "right" = "left"): this {
    this.align(align);
    this.reverse(true).bold();
    this.line(` ${text.trim()} `);
    this.bold(false).reverse(false);
    this.align("left");
    return this;
  }

  qr(data: string): this {
    this.align("center");
    this.parts.push(cmdQrCode(data));
    this.blank();
    this.align("left");
    return this;
  }

  cut(): this {
    this.blank();
    this.parts.push(CMD_CUT);
    this.cutEnabled = false;
    return this;
  }

  encode(): Uint8Array {
    if (this.cutEnabled) this.cut();
    return concatBytes(...this.parts);
  }
}

/** Strip HTML to plain text (legacy preview helper). */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function encodeEscPosText(text: string, cut = true): Uint8Array {
  const encoder = new EscPosEncoder({ cut });
  for (const line of text.split("\n")) {
    encoder.line(line);
  }
  return encoder.encode();
}
