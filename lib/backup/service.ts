import { existsSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

export type BackupInfo = {
  filename: string;
  path: string;
  sizeBytes: number;
  createdAt: string;
};

export type BackupResult = {
  success: boolean;
  file?: string;
  error?: string;
};

export type RestoreResult = {
  success: boolean;
  error?: string;
};

export function listBackups(backupDir = resolve(process.cwd(), "backups")): BackupInfo[] {
  if (!existsSync(backupDir)) return [];
  return readdirSync(backupDir)
    .filter((name) => name.endsWith(".dump") || name.endsWith(".sql"))
    .map((filename) => {
      const path = resolve(backupDir, filename);
      const stat = statSync(path);
      return {
        filename,
        path,
        sizeBytes: stat.size,
        createdAt: stat.mtime.toISOString(),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function runBackup(databaseUrl: string, backupDir?: string): BackupResult {
  const dir = backupDir ?? resolve(process.cwd(), "backups");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outfile = resolve(dir, `backup-${stamp}.dump`);

  const result = spawnSync(
    "pg_dump",
    [databaseUrl, "--format=custom", "--no-owner", "--file", outfile],
    { encoding: "utf8", shell: process.platform === "win32" }
  );

  if (result.status !== 0) {
    return {
      success: false,
      error: result.stderr || result.error?.message || "pg_dump failed",
    };
  }

  return { success: true, file: outfile };
}

export function runRestore(databaseUrl: string, backupFile: string): RestoreResult {
  if (!existsSync(backupFile)) {
    return { success: false, error: "Backup file not found" };
  }

  const result = spawnSync(
    "pg_restore",
    ["--clean", "--if-exists", "--no-owner", "--dbname", databaseUrl, backupFile],
    { encoding: "utf8", shell: process.platform === "win32" }
  );

  if (result.status !== 0) {
    return {
      success: false,
      error: result.stderr || result.error?.message || "pg_restore failed",
    };
  }

  return { success: true };
}
