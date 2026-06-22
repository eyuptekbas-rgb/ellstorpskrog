"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  Plus,
  Settings2,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import AdminFeaturePicker from "@/components/platform/AdminFeaturePicker";
import TemplatePicker from "@/components/platform/TemplatePicker";
import { ORDINA } from "@/lib/tenant/branding";
import {
  defaultAdminFeatures,
  type AdminFeatures,
} from "@/lib/tenant/admin-features";
import { publicSiteUrl } from "@/lib/tenant/public-path";
import {
  DEFAULT_TEMPLATE_ID,
  getTemplate,
  type TenantTemplateId,
} from "@/lib/tenant/templates";

type Tenant = {
  id: string;
  slug: string;
  name: string;
  customerNumber: string | null;
  templateId: string;
  primaryColor: string;
  active: boolean;
  adminFeatures: AdminFeatures | null;
  _count: { orders: number; categories: number; users: number };
};

type CreateFormState = {
  name: string;
  slug: string;
  templateId: TenantTemplateId;
  primaryColor: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
};

type ManageTab = "access" | "features" | "design";

const emptyCreateForm: CreateFormState = {
  name: "",
  slug: "",
  templateId: DEFAULT_TEMPLATE_ID,
  primaryColor: getTemplate(DEFAULT_TEMPLATE_ID).defaultPrimary,
  adminEmail: "",
  adminPassword: "",
  adminName: "",
};

const ELLSTORPS_SLUG = "ellstorps-krog";

export default function PlatformTenantsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(searchParams.get("new") === "1");
  const [manageTenant, setManageTenant] = useState<Tenant | null>(null);
  const [manageTab, setManageTab] = useState<ManageTab>("access");
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);
  const [manageForm, setManageForm] = useState({
    name: "",
    templateId: DEFAULT_TEMPLATE_ID as TenantTemplateId,
    primaryColor: "",
    active: true,
    adminFeatures: defaultAdminFeatures(),
  });
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/platform/tenants");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTenants(
        data.map((t: Tenant & { adminFeatures?: unknown }) => ({
          ...t,
          adminFeatures: t.adminFeatures
            ? (t.adminFeatures as AdminFeatures)
            : null,
        }))
      );
    } catch {
      setError("Kunde inte hämta kunder.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const enterTenant = async (tenantId: string) => {
    setEnteringId(tenantId);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      router.push("/admin");
    } catch {
      setError("Kunde inte öppna kundens admin.");
      setEnteringId(null);
    }
  };

  const openManage = (tenant: Tenant) => {
    setManageTenant(tenant);
    setManageTab("access");
    setDeleteConfirm("");
    setManageForm({
      name: tenant.name,
      templateId: (tenant.templateId as TenantTemplateId) || DEFAULT_TEMPLATE_ID,
      primaryColor: tenant.primaryColor,
      active: tenant.active,
      adminFeatures: tenant.adminFeatures ?? defaultAdminFeatures(),
    });
  };

  const toggleActive = async (tenant: Tenant) => {
    setTogglingId(tenant.id);
    setError("");
    try {
      const res = await fetch(`/api/platform/tenants/${tenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !tenant.active }),
      });
      if (!res.ok) throw new Error();
      await fetchTenants();
      if (manageTenant?.id === tenant.id) {
        setManageForm((f) => ({ ...f, active: !tenant.active }));
      }
    } catch {
      setError("Kunde inte ändra kundens status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          slug: createForm.slug || undefined,
          templateId: createForm.templateId,
          primaryColor: createForm.primaryColor,
          adminEmail: createForm.adminEmail || undefined,
          adminPassword: createForm.adminPassword || undefined,
          adminName: createForm.adminName || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }

      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      await fetchTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skapa kunden.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageTenant) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/platform/tenants/${manageTenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manageForm.name,
          templateId: manageForm.templateId,
          primaryColor: manageForm.primaryColor,
          active: manageForm.active,
          adminFeatures: manageForm.adminFeatures,
        }),
      });

      if (!res.ok) throw new Error();

      setManageTenant(null);
      await fetchTenants();
    } catch {
      setError("Kunde inte spara ändringar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!manageTenant) return;
    if (deleteConfirm !== manageTenant.name) {
      setError("Skriv restaurangnamnet exakt för att bekräfta borttagning.");
      return;
    }

    setDeletingId(manageTenant.id);
    setError("");

    try {
      const res = await fetch(`/api/platform/tenants/${manageTenant.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");

      setManageTenant(null);
      await fetchTenants();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunde inte ta bort kunden."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="px-5 py-8 pb-12">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-wide">Kunder</h1>
          <div
            className="mt-3 h-[2px] w-16 rounded-full"
            style={{ background: ORDINA.primary }}
          />
          <p className="mt-2 text-sm text-white/55">
            Pausa, aktivera, ta bort kunder och styr vilka admin-funktioner de ser
          </p>
        </div>
        <button
          onClick={() => {
            setCreateForm(emptyCreateForm);
            setCreateOpen(true);
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: ORDINA.primary }}
        >
          <Plus size={16} />
          Ny kund
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-700 bg-red-900/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-white/50">Laddar kunder…</p>
      ) : tenants.length === 0 ? (
        <div className="rounded-2xl border border-[#7c3aed]/20 bg-[#120a1f] p-12 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-[#7c3aed]/50" />
          <p className="text-white/50">Inga kunder ännu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => {
            const template = getTemplate(tenant.templateId);
            const isProtected = tenant.slug === ELLSTORPS_SLUG;

            return (
              <article
                key={tenant.id}
                className="rounded-2xl border border-[#7c3aed]/15 bg-[#120a1f] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ background: tenant.primaryColor }}
                      />
                      <h2 className="text-lg font-semibold">{tenant.name}</h2>
                      {tenant.active ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                          Aktiv
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200">
                          Pausad
                        </span>
                      )}
                      {isProtected && (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
                          Huvudkund
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-white/40">/{tenant.slug}</p>
                    {tenant.customerNumber && (
                      <p className="mt-1 text-xs font-mono text-white/55">
                        Kundnr {tenant.customerNumber}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-[#a78bfa]">{template.name}</p>
                    <p className="mt-1 text-sm text-white/50">
                      {tenant._count.categories} kategorier · {tenant._count.orders}{" "}
                      beställningar · {tenant._count.users} admin
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={publicSiteUrl(tenant.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                    >
                      <ExternalLink size={14} />
                      Frontend
                    </a>
                    <button
                      onClick={() => toggleActive(tenant)}
                      disabled={togglingId === tenant.id || isProtected}
                      title={isProtected ? "Huvudkunden kan inte pausas här" : undefined}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 disabled:opacity-40"
                    >
                      {togglingId === tenant.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : tenant.active ? (
                        <Pause size={14} />
                      ) : (
                        <Play size={14} />
                      )}
                      {tenant.active ? "Pausa" : "Aktivera"}
                    </button>
                    <button
                      onClick={() => openManage(tenant)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-3 py-2 text-sm text-[#c4b5fd]"
                    >
                      <Shield size={14} />
                      Hantera
                    </button>
                    <button
                      onClick={() => enterTenant(tenant.id)}
                      disabled={enteringId === tenant.id}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      style={{ background: ORDINA.primary }}
                    >
                      {enteringId === tenant.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Settings2 size={14} />
                      )}
                      Admin
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setCreateOpen(false)}
          />
          <div className="fixed inset-x-4 top-[5vh] z-50 mx-auto max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border border-[#7c3aed]/30 bg-[#120a1f]">
            <div className="sticky top-0 flex items-center justify-between border-b border-white/5 bg-[#120a1f] px-5 py-4">
              <h2 className="font-serif text-lg">Ny kund</h2>
              <button
                onClick={() => setCreateOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 px-5 py-4">
              <input
                required
                placeholder="Restaurangnamn"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                className="w-full rounded-xl border border-[#7c3aed]/30 bg-[#0a0612] p-3 text-white"
              />
              <input
                placeholder="Slug (valfritt)"
                value={createForm.slug}
                onChange={(e) =>
                  setCreateForm({ ...createForm, slug: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#0a0612] p-3 text-white"
              />
              <TemplatePicker
                value={createForm.templateId}
                onChange={(templateId) =>
                  setCreateForm({ ...createForm, templateId })
                }
                primaryColor={createForm.primaryColor}
                onPrimaryColorChange={(primaryColor) =>
                  setCreateForm({ ...createForm, primaryColor })
                }
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 rounded-xl bg-white/5 py-3 text-white/70"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl py-3 font-semibold text-white disabled:opacity-60"
                  style={{ background: ORDINA.primary }}
                >
                  {saving ? "Skapar…" : "Skapa kund"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Manage modal */}
      {manageTenant && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setManageTenant(null)}
          />
          <div className="fixed inset-x-4 top-[3vh] z-50 mx-auto flex max-h-[94vh] max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#7c3aed]/30 bg-[#120a1f]">
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-4">
              <div>
                <h2 className="font-serif text-lg">Hantera — {manageTenant.name}</h2>
                <p className="text-xs text-white/40">/{manageTenant.slug}</p>
              </div>
              <button
                onClick={() => setManageTenant(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex shrink-0 gap-1 border-b border-white/5 px-5 py-2">
              {(
                [
                  ["access", "Status"],
                  ["features", "Admin-funktioner"],
                  ["design", "Designmall"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setManageTab(id)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    manageTab === id
                      ? "bg-[#7c3aed]/20 text-[#c4b5fd]"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSaveManage}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {manageTab === "access" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <p className="text-sm font-medium text-white/90">
                        Systemstatus
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        Pausade kunder kan inte använda sin publika webbplats. Deras
                        egna admin-inloggning blockeras. Du som plattformsadmin kan
                        fortfarande öppna deras admin.
                      </p>
                      <label className="mt-4 flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={manageForm.active}
                          disabled={manageTenant.slug === ELLSTORPS_SLUG}
                          onChange={(e) =>
                            setManageForm({ ...manageForm, active: e.target.checked })
                          }
                          className="h-4 w-4 accent-[#7c3aed]"
                        />
                        <span className="text-sm">
                          {manageForm.active ? "Aktiv — kunden är live" : "Pausad — kunden är stoppad"}
                        </span>
                      </label>
                    </div>

                    {manageTenant.slug !== ELLSTORPS_SLUG && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                        <p className="flex items-center gap-2 text-sm font-medium text-red-200">
                          <Trash2 size={16} />
                          Ta bort kund permanent
                        </p>
                        <p className="mt-1 text-xs text-red-200/60">
                          Raderar all data: meny, beställningar, bokningar och
                          inställningar. Kan inte ångras.
                        </p>
                        <input
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder={`Skriv "${manageTenant.name}" för att bekräfta`}
                          className="mt-3 w-full rounded-xl border border-red-500/25 bg-[#0a0612] p-3 text-sm text-white"
                        />
                        <button
                          type="button"
                          disabled={
                            deletingId === manageTenant.id ||
                            deleteConfirm !== manageTenant.name
                          }
                          onClick={handleDelete}
                          className="mt-3 w-full rounded-xl border border-red-500/40 bg-red-500/15 py-2.5 text-sm font-semibold text-red-200 disabled:opacity-40"
                        >
                          {deletingId === manageTenant.id
                            ? "Tar bort…"
                            : "Ta bort kund permanent"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {manageTab === "features" && (
                  <div>
                    <p className="mb-4 text-sm text-white/50">
                      Välj vilka moduler kundens admin ser i sidomenyn. Du ser
                      alltid allt när du öppnar deras admin som plattformsadmin.
                    </p>
                    <AdminFeaturePicker
                      value={manageForm.adminFeatures}
                      onChange={(adminFeatures) =>
                        setManageForm({ ...manageForm, adminFeatures })
                      }
                    />
                  </div>
                )}

                {manageTab === "design" && (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs text-white/50">
                        Visningsnamn
                      </label>
                      <input
                        required
                        value={manageForm.name}
                        onChange={(e) =>
                          setManageForm({ ...manageForm, name: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#7c3aed]/30 bg-[#0a0612] p-3 text-white"
                      />
                    </div>
                    <TemplatePicker
                      value={manageForm.templateId}
                      onChange={(templateId) =>
                        setManageForm({ ...manageForm, templateId })
                      }
                      primaryColor={manageForm.primaryColor}
                      onPrimaryColorChange={(primaryColor) =>
                        setManageForm({ ...manageForm, primaryColor })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex shrink-0 gap-3 border-t border-white/5 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setManageTenant(null)}
                  className="flex-1 rounded-xl bg-white/5 py-3 text-white/70"
                >
                  Stäng
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl py-3 font-semibold text-white disabled:opacity-60"
                  style={{ background: ORDINA.primary }}
                >
                  {saving ? "Sparar…" : "Spara ändringar"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
