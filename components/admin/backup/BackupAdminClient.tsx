"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Database, Download, Loader2, RefreshCw } from "lucide-react";

type BackupRow = {
  filename: string;
  sizeBytes: number;
  createdAt: string;
};

function BackupAdminClient() {
  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runBackup = async () => {
    setRunning(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await res.json();
      setMessage(res.ok ? `Backup skapad: ${data.file}` : data.error ?? "Backup misslyckades");
      await refresh();
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d4a574]">
            Backup
          </p>
          <h1 className="font-serif text-3xl text-white">Databassäkerhet</h1>
        </div>
        <button
          type="button"
          onClick={() => void runBackup()}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-xl bg-[#b85c38] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
          Kör backup
        </button>
      </header>

      {message ? <p className="text-sm text-white/60">{message}</p> : null}

      <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Backupfiler</h2>
          <button type="button" onClick={() => void refresh()} className="text-white/50">
            <RefreshCw size={16} />
          </button>
        </div>
        {loading ? (
          <Loader2 className="animate-spin text-white/40" />
        ) : backups.length === 0 ? (
          <p className="text-sm text-white/45">Inga backupfiler hittades lokalt.</p>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <div
                key={backup.filename}
                className="flex items-center justify-between rounded-xl border border-white/6 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{backup.filename}</p>
                  <p className="text-white/40">
                    {(backup.sizeBytes / 1024 / 1024).toFixed(2)} MB ·{" "}
                    {new Date(backup.createdAt).toLocaleString("sv-SE")}
                  </p>
                </div>
                <Download size={16} className="text-white/35" />
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-white/35">
          Restore: `npm run ops:restore -- backups/&lt;file&gt;.dump` (CLI)
        </p>
      </section>
    </div>
  );
}

export default memo(BackupAdminClient);
