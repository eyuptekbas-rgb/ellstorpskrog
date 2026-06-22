#!/usr/bin/env npx tsx
/**
 * Automated PostgreSQL backup (Launch Priority 3).
 * Usage: npm run ops:backup
 *
 * Requires: pg_dump on PATH, DATABASE_URL set.
 * Output: backups/backup-YYYYMMDD-HHMMSS.dump
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadDotEnv } from "../../lib/env/launch-vars";

loadDotEnv();

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const backupDir = resolve(process.cwd(), "backups");
if (!existsSync(backupDir)) {
  mkdirSync(backupDir, { recursive: true });
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outfile = resolve(backupDir, `backup-${stamp}.dump`);

console.log(`Backing up to ${outfile}...`);

const result = spawnSync(
  "pg_dump",
  [databaseUrl, "--format=custom", "--no-owner", "--file", outfile],
  { encoding: "utf8", shell: process.platform === "win32" }
);

if (result.status !== 0) {
  console.error("pg_dump failed:");
  console.error(result.stderr || result.error?.message);
  console.error("\nEnsure PostgreSQL client tools are installed and DATABASE_URL is reachable.");
  console.error("On managed hosts (Neon/Supabase/Vercel Postgres), use provider snapshots instead.");
  process.exit(1);
}

console.log("Backup completed successfully.");
console.log(`File: ${outfile}`);
console.log("\nRestore: npm run ops:restore -- backups/<file>.dump");
