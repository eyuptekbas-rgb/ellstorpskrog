"use client";

import { useCallback, useEffect, useState } from "react";
import {
  VIP_LEVEL_LABELS,
  type CustomerDashboardStats,
  type CustomerListItem,
  type CustomerProfileDetail,
  type CustomerTag,
  type CustomerVipLevel,
} from "@/lib/customers/crm";
import { formatOrderDate } from "@/lib/orders";
import { ArrowLeft, RefreshCw, Search, Users } from "lucide-react";
import CustomerProfileView from "@/components/admin/customers/CustomerProfileView";
import CustomerStatsWidgets from "@/components/admin/customers/CustomerStatsWidgets";

export default function CustomersAdminClient() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [stats, setStats] = useState<CustomerDashboardStats>({
    newToday: 0,
    returning: 0,
    vipCount: 0,
    topCustomers: [],
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomers(data.customers);
      setStats(data.stats);
    } catch {
      setError("Kunde inte hämta kunder.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchProfile = useCallback(async (id: string) => {
    setProfileLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (!res.ok) throw new Error();
      setProfile(await res.json());
    } catch {
      setError("Kunde inte hämta kundprofil.");
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

  const patchProfile = async (body: Record<string, unknown>) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setProfile(await res.json());
      await fetchList();
    } catch {
      setError("Kunde inte uppdatera kund.");
    } finally {
      setBusy(false);
    }
  };

  const handleNoteCreate = async (body: string) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedId}/notes`, {
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

  const handleNoteEdit = async (noteId: string, body: string) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, body }),
      });
      if (!res.ok) throw new Error();
      await fetchProfile(selectedId);
    } catch {
      setError("Kunde inte uppdatera anteckning.");
    } finally {
      setBusy(false);
    }
  };

  const handleNoteDelete = async (noteId: string) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/customers/${selectedId}/notes?noteId=${encodeURIComponent(noteId)}`,
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
          <p className="section-label mb-3">CRM</p>
          <h1 className="font-serif text-3xl text-white sm:text-4xl">Kunder</h1>
          <p className="mt-3 text-sm text-white/45">
            {loading ? "Laddar…" : `${customers.length} kunder i registret`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchList()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Uppdatera
        </button>
      </header>

      {!selectedId && (
        <div className="mb-6">
          <CustomerStatsWidgets stats={stats} />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className={`space-y-4 ${selectedId ? "hidden lg:block lg:col-span-2" : "lg:col-span-2"}`}>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="search"
              placeholder="Sök namn, telefon eller e-post…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/8 bg-[#1a1a1a] py-3 pl-11 pr-4 text-white placeholder:text-white/40 focus:border-[#b85c38]/50 focus:outline-none"
            />
          </div>

          {loading ? (
            <p className="text-sm text-white/45">Laddar kunder…</p>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-12 text-white/40">
              <Users size={28} />
              <p className="text-sm">Inga kunder hittades.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {customers.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(customer.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedId === customer.id
                        ? "border-[#b85c38]/40 bg-[#b85c38]/10"
                        : "border-white/6 bg-[#121212] hover:border-[#b85c38]/25"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{customer.name}</p>
                        <p className="mt-0.5 truncate text-xs text-white/40">
                          {customer.email}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#b85c38]/15 px-2 py-0.5 text-[10px] font-semibold text-[#e8c4a8]">
                        {VIP_LEVEL_LABELS[customer.vipLevel]}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/45">
                      <span>{customer.totalOrders} ordrar</span>
                      <span>{customer.totalSpent} kr</span>
                      <span>{customer.loyaltyPoints} p</span>
                    </div>
                    {customer.lastOrderAt && (
                      <p className="mt-1 text-[10px] text-white/30">
                        Senast: {formatOrderDate(new Date(customer.lastOrderAt))}
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
              Tillbaka till listan
            </button>
          )}

          {selectedId && profileLoading && (
            <p className="text-sm text-white/45">Laddar profil…</p>
          )}

          {selectedId && profile && !profileLoading && (
            <CustomerProfileView
              profile={profile}
              busy={busy}
              onTagsChange={(tags: CustomerTag[]) => void patchProfile({ tags })}
              onVipChange={(vipLevel: CustomerVipLevel) =>
                void patchProfile({ vipLevel, vipOverride: true })
              }
              onLoyaltyAdjust={(pointsDelta, reason) =>
                void patchProfile({ pointsDelta, reason })
              }
              onNoteCreate={handleNoteCreate}
              onNoteEdit={handleNoteEdit}
              onNoteDelete={handleNoteDelete}
            />
          )}

          {!selectedId && (
            <div className="hidden rounded-3xl border border-dashed border-white/10 py-20 text-center lg:block">
              <Users size={32} className="mx-auto text-white/20" />
              <p className="mt-3 text-sm text-white/40">
                Välj en kund för att se profil, lojalitet och tidslinje.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
