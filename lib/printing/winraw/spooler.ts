import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SCRIPT_PATH = join(process.cwd(), "tools/windows-print-agent/raw-spooler.ps1");

export type WindowsRawPrintResult = {
  success: boolean;
  error?: string;
  bytesSent?: number;
};

/** Send raw ESC/POS bytes to a Windows printer via the spooler (RAW datatype). */
export async function sendRawToWindowsPrinter(
  printerName: string,
  data: Uint8Array
): Promise<WindowsRawPrintResult> {
  const name = printerName.trim();
  if (!name) {
    return { success: false, error: "Windows printer name is required." };
  }

  if (process.platform !== "win32") {
    return {
      success: false,
      error: "Windows RAW spooler is only available on Windows hosts.",
    };
  }

  const tempPath = join(tmpdir(), `escpos-${randomBytes(8).toString("hex")}.bin`);

  try {
    await writeFile(tempPath, Buffer.from(data));

    await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        SCRIPT_PATH,
        "-PrinterName",
        name,
        "-FilePath",
        tempPath,
      ],
      { timeout: 30_000, windowsHide: true }
    );

    return { success: true, bytesSent: data.length };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "stderr" in err
          ? String((err as { stderr?: string }).stderr ?? err)
          : "Windows RAW print failed.";
    return { success: false, error: message.trim() || "Windows RAW print failed." };
  } finally {
    await unlink(tempPath).catch(() => undefined);
  }
}
