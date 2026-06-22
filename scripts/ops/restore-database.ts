#!/usr/bin/env npx tsx
/**
 * PostgreSQL restore helper (Launch Priority 3).
 * Usage: npm run ops:restore -- backups/backup-YYYYMMDD.dump
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadDotEnv } from "../../lib/env/launch-vars";

async function main() {
  loadDotEnv();

  const dumpFile = process.argv[2];
  if (!dumpFile) {
    console.error("Usage: npm run ops:restore -- <path-to-backup.dump>");
    process.exit(1);
  }

  const absPath = resolve(process.cwd(), dumpFile);
  if (!existsSync(absPath)) {
    console.error(`Backup file not found: ${absPath}`);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("WARNING: This will restore into the database at DATABASE_URL.");
  console.log(`File: ${absPath}`);
  console.log("Proceeding in 3 seconds... (Ctrl+C to abort)");
  await new Promise((r) => setTimeout(r, 3000));

  const result = spawnSync(
    "pg_restore",
    ["--clean", "--if-exists", "--no-owner", `--dbname=${databaseUrl}`, absPath],
    { encoding: "utf8", shell: process.platform === "win32" }
  );

  if (result.status !== 0) {
    console.error("pg_restore completed with errors (some may be harmless):");
    console.error(result.stderr?.slice(0, 2000));
    process.exit(1);
  }

  console.log("Restore completed. Run: npx prisma migrate deploy && npm run db:check");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
