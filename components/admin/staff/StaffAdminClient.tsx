"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, RefreshCw, Search, Shield } from "lucide-react";
import StaffProfileView from "@/components/admin/staff/StaffProfileView";
import PermissionMatrix from "@/components/admin/staff/PermissionMatrix";
import StaffStatsWidgets from "@/components/admin/staff/StaffStatsWidgets";
import {
  STAFF_JOB_ROLE_LABELS,
  STAFF_JOB_ROLES,
  STAFF_STATUS_LABELS,
  type StaffJobRoleKey,
  type StaffPermission,
} from "@/lib/staff/permissions";
import type {
  StaffDashboardStats,
  StaffListItem,
  StaffProfileDetail,
} from "@/lib/staff/staff-service";
import { formatOrderDate } from "@/lib/orders";

export default function StaffAdminClient() {
  const [search, setSearch] = useState("");
  const [staff, setStaff] = useState<StaffListItem[]>([]);
  const [stats, setStats] = useState<StaffDashboardStats>({
    staffOnline: 0,
    activeSessions: 0,
    recentLogins: [],
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profile, setProfile] = useState<StaffProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    phone: "",
    staffJobRole: "WAITER" as StaffJobRoleKey,
  });

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/staff?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStaff(data.staff);
      setStats(data.stats);
    } catch {
      setError("Kunde inte hämta personal.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchProfile = useCallback(async (id: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/${id}`);
      if (!res.ok) throw new Error();
      setProfile(await res.json());
    } catch {
      setError("Kunde inte hämta profil.");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void fetchList(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchList, search]);

  useEffect(() => {
    if (selectedId) void fetchProfile(selectedId);
    else setProfile(null);
  }, [selectedId, fetchProfile]);

  const patchStaff = async (body: Record<string, unknown>) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/staff/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.tempPassword) setTempPassword(data.tempPassword);
      else setProfile(data);
      await fetchList();
    } catch {
      setError("Kunde inte uppdatera personal.");
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTempPassword(data.tempPassword);
      setInviteOpen(false);
      setInviteForm({ name: "", email: "", phone: "", staffJobRole: "WAITER" });
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte bjuda in.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || !confirm("Radera denna anställd permanent?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/staff/${selectedId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSelectedId(null);
      await fetchList();
    } catch {
      setError("Kunde inte radera personal.");
    } finally {
      setBusy(false);
    }
  };

  const handleNoteCreate = async (body: string) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/staff/${selectedId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error();
      await fetchProfile(selectedId);
    } catch {
      setError("Kunde inte spara anteckning.");
    } finally {
      setBusy(false);
    }
  };

  const handleNoteDelete = async (noteId: string) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/staff/${selectedId}/notes?noteId=${encodeURIComponent(noteId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      await fetchProfile(selectedId);
    } catch {
      setError("Kunde inte radera anteckning.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 py-6 pb-12 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-white/[0.05] pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="section-label mb-3">Team</p>
          <h1 className="font-serif text-3xl text-white sm:text-4xl">Personal</h1>
          <p className="mt-3 text-sm text-white/45">
            {loading ? "Laddar…" : `${staff.length} anställda`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#b85c38] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            Bjud in
          </button>
          <button
            type="button"
            onClick={() => void fetchList()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Uppdatera
          </button>
        </div>
      </header>

      {!selectedId && (
        <>
          <div className="mb-6">
            <StaffStatsWidgets stats={stats} />
          </div>
          <div className="mb-8">
            <PermissionMatrix />
          </div>
        </>
      )}

      {tempPassword && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Tillfälligt lösenord: <strong>{tempPassword}</strong> — dela säkert med medarbetaren.
          <button
            type="button"
            onClick={() => setTempPassword(null)}
            className="ml-3 text-xs underline"
          >
            Stäng
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <form
            onSubmit={(e) => void handleInvite(e)}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1a1a] p-6"
          >
            <h2 className="font-serif text-xl text-white">Bjud in personal</h2>
            <div className="mt-4 space-y-3">
              <input
                required
                placeholder="Namn"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                className="w-full rounded-xl border border-white/8 bg-[#121212] px-3 py-2.5 text-sm text-white"
              />
              <input
                required
                type="email"
                placeholder="E-post"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="w-full rounded-xl border border-white/8 bg-[#121212] px-3 py-2.5 text-sm text-white"
              />
              <input
                placeholder="Telefon"
                value={inviteForm.phone}
                onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                className="w-full rounded-xl border border-white/8 bg-[#121212] px-3 py-2.5 text-sm text-white"
              />
              <select
                value={inviteForm.staffJobRole}
                onChange={(e) =>
                  setInviteForm({
                    ...inviteForm,
                    staffJobRole: e.target.value as StaffJobRoleKey,
                  })
                }
                className="w-full rounded-xl border border-white/8 bg-[#121212] px-3 py-2.5 text-sm text-white"
              >
                {STAFF_JOB_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {STAFF_JOB_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-white/70"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-xl bg-[#b85c38] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Skicka inbjudan
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className={`space-y-4 ${selectedId ? "hidden lg:block lg:col-span-2" : "lg:col-span-2"}`}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="search"
              placeholder="Sök namn, e-post eller telefon…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/8 bg-[#1a1a1a] py-3 pl-11 pr-4 text-white placeholder:text-white/40 focus:border-[#b85c38]/50 focus:outline-none"
            />
          </div>

          {loading ? (
            <p className="text-sm text-white/45">Laddar…</p>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-12 text-white/40">
              <Shield size={28} />
              <p className="text-sm">Ingen personal hittades.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {staff.map((member) => (
                <li key={member.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(member.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedId === member.id
                        ? "border-[#b85c38]/40 bg-[#b85c38]/10"
                        : "border-white/6 bg-[#121212] hover:border-[#b85c38]/25"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-white">{member.name}</p>
                        <p className="text-xs text-white/40">{member.email}</p>
                      </div>
                      {member.isOnline && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/50">
                        {member.staffJobRole
                          ? STAFF_JOB_ROLE_LABELS[member.staffJobRole]
                          : "—"}
                      </span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-white/50">
                        {member.staffStatus
                          ? STAFF_STATUS_LABELS[member.staffStatus]
                          : "—"}
                      </span>
                    </div>
                    {member.lastLoginAt && (
                      <p className="mt-1 text-[10px] text-white/30">
                        Senast: {formatOrderDate(new Date(member.lastLoginAt))}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${selectedId ? "lg:col-span-3" : "hidden lg:block lg:col-span-3"}`}>
          {selectedId && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="mb-4 inline-flex items-center gap-2 text-sm text-[#d4a574] lg:hidden"
            >
              <ArrowLeft size={16} />
              Tillbaka
            </button>
          )}

          {selectedId && profileLoading && (
            <p className="text-sm text-white/45">Laddar profil…</p>
          )}

          {selectedId && profile && !profileLoading && (
            <StaffProfileView
              profile={profile}
              busy={busy}
              onPermissionsChange={(permissions: StaffPermission[]) =>
                void patchStaff({ permissions })
              }
              onRoleChange={(staffJobRole, customRoleLabel) =>
                void patchStaff({ staffJobRole, customRoleLabel })
              }
              onToggle2fa={(twoFactorEnabled) => void patchStaff({ twoFactorEnabled })}
              onActivate={() => void patchStaff({ action: "activate" })}
              onDeactivate={() => void patchStaff({ action: "deactivate" })}
              onForceLogout={() => void patchStaff({ action: "force-logout" })}
              onResetPassword={() => void patchStaff({ action: "reset-password" })}
              onDelete={() => void handleDelete()}
              onNoteCreate={handleNoteCreate}
              onNoteDelete={handleNoteDelete}
            />
          )}

          {!selectedId && (
            <div className="hidden rounded-3xl border border-dashed border-white/10 py-20 text-center lg:block">
              <Shield size={32} className="mx-auto text-white/20" />
              <p className="mt-3 text-sm text-white/40">
                Välj en anställd för att hantera roll, behörigheter och säkerhet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
