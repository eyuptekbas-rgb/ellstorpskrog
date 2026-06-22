import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { getAgentPaths } from "./paths";

const execFileAsync = promisify(execFile);

export type WindowsRawPrintResult = {
  success: boolean;
  error?: string;
  bytesSent?: number;
};

function scriptPath(name: string): string {
  const paths = getAgentPaths();
  const installed = join(paths.scriptDir, name);
  if (existsSync(installed)) return installed;
  return join(paths.installDir, name);
}

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

  const tempPath = join(getAgentPaths().dataDir, `escpos-${randomBytes(8).toString("hex")}.bin`);

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
        scriptPath("raw-spooler.ps1"),
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

export async function testOpenPrinter(printerName: string): Promise<{
  success: boolean;
  error?: string;
  win32Code?: number;
}> {
  const name = printerName.trim();
  if (!name) return { success: false, error: "Printer name required." };

  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath("open-printer-test.ps1"),
        "-PrinterName",
        name,
      ],
      { timeout: 15_000, windowsHide: true }
    );
    const parsed = JSON.parse(stdout.trim()) as {
      success: boolean;
      error?: string;
      win32Code?: number;
    };
    return parsed;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "OpenPrinter test failed.",
    };
  }
}
