"use client";

import { useState } from "react";
import {
  STAFF_JOB_ROLE_LABELS,
  STAFF_JOB_ROLES,
  STAFF_PERMISSION_KEYS,
  STAFF_PERMISSION_LABELS,
  STAFF_STATUS_LABELS,
  type StaffJobRoleKey,
  type StaffPermission,
} from "@/lib/staff/permissions";
import type { StaffProfileDetail } from "@/lib/staff/staff-service";
import { formatOrderDate } from "@/lib/orders";

type Props = {
  profile: StaffProfileDetail;
  busy?: boolean;
  onPermissionsChange: (permissions: StaffPermission[]) => void;
  onRoleChange: (role: StaffJobRoleKey, customLabel?: string) => void;
  onToggle2fa: (enabled: boolean) => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onForceLogout: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
  onNoteCreate: (body: string) => void;
  onNoteDelete: (noteId: string) => void;
};

export default function StaffProfileView({
  profile,
  busy,
  onPermissionsChange,
  onRoleChange,
  onToggle2fa,
  onActivate,
  onDeactivate,
  onForceLogout,
  onResetPassword,
  onDelete,
  onNoteCreate,
  onNoteDelete,
}: Props) {
  const [noteDraft, setNoteDraft] = useState("");
  const [customLabel, setCustomLabel] = useState(profile.customRoleLabel ?? "");

  const statusLabel = profile.staffStatus
    ? STAFF_STATUS_LABELS[profile.staffStatus]
    : "—";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/8 bg-gradient-to-b from-[#1a1a1a] to-[#141414] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-white">{profile.name}</h2>
            <p className="mt-1 text-sm text-white/45">{profile.email}</p>
            {profile.phone && <p className="text-sm text-white/55">{profile.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-white/35">Status</p>
            <p className="font-serif text-lg text-[#e8c4a8]">{statusLabel}</p>
            <p className="mt-1 text-xs text-white/40">
              {profile.staffJobRole
                ? STAFF_JOB_ROLE_LABELS[profile.staffJobRole]
                : "—"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p className="text-white/55">
            Senaste inloggning:{" "}
            {profile.lastLoginAt ? formatOrderDate(new Date(profile.lastLoginAt)) : "—"}
          </p>
          <p className="text-white/55">
            Skapad: {formatOrderDate(new Date(profile.createdAt))}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {profile.staffStatus !== "ACTIVE" && (
            <button
              type="button"
              disabled={busy}
              onClick={onActivate}
              className="rounded-xl bg-[#b85c38] px-3 py-2 text-xs font-semibold text-white"
            >
              Aktivera
            </button>
          )}
          {profile.staffStatus === "ACTIVE" && (
            <button
              type="button"
              disabled={busy}
              onClick={onDeactivate}
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
            >
              Inaktivera
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onForceLogout}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
          >
            Tvinga utloggning
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onResetPassword}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
          >
            Återställ lösenord
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
          >
            Radera
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5">
        <h3 className="font-serif text-lg text-white">Roll</h3>
        <select
          value={profile.staffJobRole ?? "CUSTOM"}
          disabled={busy}
          onChange={(e) =>
            onRoleChange(
              e.target.value as StaffJobRoleKey,
              e.target.value === "CUSTOM" ? customLabel : undefined
            )
          }
          className="mt-3 w-full rounded-xl border border-white/8 bg-[#121212] px-3 py-2.5 text-sm text-white"
        >
          {STAFF_JOB_ROLES.map((role) => (
            <option key={role} value={role} className="bg-[#1a1a1a]">
              {STAFF_JOB_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        {profile.staffJobRole === "CUSTOM" && (
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onBlur={() => onRoleChange("CUSTOM", customLabel)}
            placeholder="Anpassat rollnamn"
            className="mt-2 w-full rounded-xl border border-white/8 bg-[#121212] px-3 py-2 text-sm text-white"
          />
        )}
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5">
        <h3 className="font-serif text-lg text-white">Behörigheter</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {STAFF_PERMISSION_KEYS.map((perm) => {
            const active = profile.permissions.includes(perm);
            return (
              <button
                key={perm}
                type="button"
                disabled={busy}
                onClick={() => {
                  const next = active
                    ? profile.permissions.filter((p) => p !== perm)
                    : [...profile.permissions, perm];
                  onPermissionsChange(next);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  active
                    ? "bg-[#b85c38] text-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {STAFF_PERMISSION_LABELS[perm]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5">
        <h3 className="font-serif text-lg text-white">Säkerhet</h3>
        <label className="mt-3 flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={profile.twoFactorEnabled}
            disabled={busy}
            onChange={(e) => onToggle2fa(e.target.checked)}
            className="h-4 w-4 rounded border-white/20"
          />
          Tvåfaktorsautentisering (redo — aktiveras snart)
        </label>
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5">
        <h3 className="font-serif text-lg text-white">Anteckningar</h3>
        <div className="mt-3 flex gap-2">
          <input
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Ny anteckning…"
            className="flex-1 rounded-xl border border-white/8 bg-[#121212] px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            disabled={busy || !noteDraft.trim()}
            onClick={() => {
              onNoteCreate(noteDraft.trim());
              setNoteDraft("");
            }}
            className="rounded-xl bg-[#b85c38] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Spara
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {profile.notes.map((note) => (
            <li key={note.id} className="rounded-xl border border-white/6 bg-[#121212] p-3">
              <p className="text-sm text-white/70">{note.body}</p>
              <div className="mt-2 flex gap-3 text-[10px] text-white/35">
                <button type="button" onClick={() => onNoteDelete(note.id)} className="hover:text-red-300">
                  Radera
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5">
        <h3 className="font-serif text-lg text-white">Aktivitet</h3>
        <ul className="mt-4 space-y-3">
          {profile.activity.slice(0, 20).map((event) => (
            <li key={event.id} className="flex gap-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#b85c38]" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-sm font-medium text-white">{event.title}</p>
                  <time className="text-[10px] text-white/35">
                    {formatOrderDate(new Date(event.at))}
                  </time>
                </div>
                {event.subtitle && (
                  <p className="mt-0.5 text-xs text-white/45">{event.subtitle}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
