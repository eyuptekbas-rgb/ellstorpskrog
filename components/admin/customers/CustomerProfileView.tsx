"use client";

import { useState } from "react";
import type { ReservationStatus } from "@prisma/client";
import {
  CUSTOMER_VIP_LEVELS,
  CUSTOMER_TAG_LABELS,
  VIP_LEVEL_LABELS,
  type CustomerProfileDetail,
  type CustomerTag,
  type CustomerVipLevel,
} from "@/lib/customers/crm";
import {
  CalendarPlus,
  Copy,
  Mail,
  Phone,
  ShoppingBag,
} from "lucide-react";
import { RESERVATION_STATUS_LABELS } from "@/lib/reservations";
import { formatOrderDate } from "@/lib/orders";

type Props = {
  profile: CustomerProfileDetail;
  onTagsChange: (tags: CustomerTag[]) => void;
  onVipChange: (level: CustomerVipLevel) => void;
  onLoyaltyAdjust: (delta: number, reason: string) => void;
  onNoteCreate: (body: string) => void;
  onNoteEdit: (noteId: string, body: string) => void;
  onNoteDelete: (noteId: string) => void;
  busy?: boolean;
};

const ALL_TAGS: CustomerTag[] = [
  "VIP",
  "REGULAR",
  "BLOCKED",
  "DELIVERY_ONLY",
  "PICKUP_ONLY",
];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

export default function CustomerProfileView({
  profile,
  onTagsChange,
  onVipChange,
  onLoyaltyAdjust,
  onNoteCreate,
  onNoteEdit,
  onNoteDelete,
  busy,
}: Props) {
  const [noteDraft, setNoteDraft] = useState("");
  const [loyaltyDelta, setLoyaltyDelta] = useState("");
  const [loyaltyReason, setLoyaltyReason] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/8 bg-gradient-to-b from-[#1a1a1a] to-[#141414] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-white">{profile.name}</h2>
            <p className="mt-1 text-sm text-white/45">{profile.email}</p>
            {profile.phone && (
              <p className="mt-0.5 text-sm text-white/55">{profile.phone}</p>
            )}
            {profile.address && (
              <p className="mt-2 text-sm text-white/45">{profile.address}</p>
            )}
          </div>
          <div className="rounded-2xl bg-[#b85c38]/12 px-4 py-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-white/40">VIP</p>
            <p className="font-serif text-lg text-[#e8c4a8]">
              {VIP_LEVEL_LABELS[profile.vipLevel]}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
            >
              <Phone size={14} />
              Ring
            </a>
          )}
          {profile.phone && (
            <button
              type="button"
              onClick={() => void copyText(profile.phone!)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
            >
              <Copy size={14} />
              Kopiera telefon
            </button>
          )}
          <button
            type="button"
            onClick={() => void copyText(profile.email)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
          >
            <Mail size={14} />
            Kopiera e-post
          </button>
          <a
            href={`/admin/reservations?email=${encodeURIComponent(profile.email)}`}
            className="inline-flex items-center gap-2 rounded-xl border border-[#b85c38]/30 bg-[#b85c38]/10 px-3 py-2 text-xs text-[#e8c4a8] hover:bg-[#b85c38]/20"
          >
            <CalendarPlus size={14} />
            Skapa reservation
          </a>
          <a
            href={`/admin/orders?search=${encodeURIComponent(profile.email)}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
          >
            <ShoppingBag size={14} />
            Visa ordrar
          </a>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Ordrar", value: profile.totalOrders },
          { label: "Spenderat", value: `${profile.lifetimeSpend} kr` },
          { label: "Snittorder", value: `${profile.averageOrder} kr` },
          { label: "Poäng", value: profile.loyaltyPoints },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/6 bg-[#121212] px-4 py-3"
          >
            <p className="text-[10px] uppercase tracking-wider text-white/35">{label}</p>
            <p className="mt-1 font-serif text-xl text-white">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5">
        <h3 className="font-serif text-lg text-white">Beställningshistorik</h3>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p className="text-white/55">
            Första order:{" "}
            {profile.firstOrderAt ? formatOrderDate(new Date(profile.firstOrderAt)) : "—"}
          </p>
          <p className="text-white/55">
            Senaste order:{" "}
            {profile.lastOrderAt ? formatOrderDate(new Date(profile.lastOrderAt)) : "—"}
          </p>
          <p className="text-white/55">
            Favoriträtt: {profile.favouriteDishes[0]?.name ?? "—"}
          </p>
          <p className="text-white/55">
            Favoritkategori: {profile.favouriteCategory ?? "—"}
          </p>
        </div>
        {profile.favouriteDishes.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.favouriteDishes.map((d) => (
              <li
                key={d.name}
                className="rounded-full bg-[#b85c38]/10 px-3 py-1 text-xs text-[#e8c4a8]"
              >
                {d.name} ×{d.count}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5">
        <h3 className="font-serif text-lg text-white">Reservationer</h3>
        <p className="mt-1 text-sm text-white/45">
          {profile.reservationCount} totalt · senast{" "}
          {profile.lastReservationAt
            ? formatOrderDate(new Date(profile.lastReservationAt))
            : "—"}
        </p>
        {profile.reservations.length > 0 && (
          <ul className="mt-3 space-y-2">
            {profile.reservations.slice(0, 5).map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-white/6 bg-[#121212] px-3 py-2 text-sm"
              >
                <span className="text-white/70">
                  {r.date} {r.time} · {r.guestCount} gäster
                </span>
                <span className="text-xs text-white/40">
                  {RESERVATION_STATUS_LABELS[r.status as ReservationStatus] ?? r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5">
        <h3 className="font-serif text-lg text-white">Taggar</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_TAGS.map((tag) => {
            const active = profile.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                disabled={busy}
                onClick={() => {
                  const next = active
                    ? profile.tags.filter((t) => t !== tag)
                    : [...profile.tags, tag];
                  onTagsChange(next);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-[#b85c38] text-white"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {CUSTOMER_TAG_LABELS[tag]}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-white/35">
            VIP-nivå (manuell)
          </label>
          <select
            value={profile.vipLevel}
            disabled={busy}
            onChange={(e) => onVipChange(e.target.value as CustomerVipLevel)}
            className="w-full rounded-xl border border-white/8 bg-[#121212] px-3 py-2.5 text-sm text-white"
          >
            {CUSTOMER_VIP_LEVELS.map((level) => (
              <option key={level} value={level} className="bg-[#1a1a1a]">
                {VIP_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5">
        <h3 className="font-serif text-lg text-white">Lojalitet</h3>
        <p className="mt-1 text-sm text-white/45">
          Livstidsköp: {profile.lifetimeSpend} kr · {profile.loyaltyPoints} poäng
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            placeholder="± poäng"
            value={loyaltyDelta}
            onChange={(e) => setLoyaltyDelta(e.target.value)}
            className="rounded-xl border border-white/8 bg-[#121212] px-3 py-2 text-sm text-white sm:w-28"
          />
          <input
            type="text"
            placeholder="Anledning"
            value={loyaltyReason}
            onChange={(e) => setLoyaltyReason(e.target.value)}
            className="flex-1 rounded-xl border border-white/8 bg-[#121212] px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            disabled={busy || !loyaltyDelta || !loyaltyReason.trim()}
            onClick={() => {
              onLoyaltyAdjust(Number(loyaltyDelta), loyaltyReason.trim());
              setLoyaltyDelta("");
              setLoyaltyReason("");
            }}
            className="rounded-xl bg-[#b85c38] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Justera
          </button>
        </div>
        {profile.loyaltyEvents.length > 0 && (
          <ul className="mt-4 space-y-2">
            {profile.loyaltyEvents.slice(0, 8).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-xl border border-white/6 bg-[#121212] px-3 py-2 text-sm"
              >
                <span className="text-white/65">{e.reason}</span>
                <span className={e.pointsDelta >= 0 ? "text-emerald-300" : "text-red-300"}>
                  {e.pointsDelta >= 0 ? "+" : ""}
                  {e.pointsDelta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5">
        <h3 className="font-serif text-lg text-white">Adminanteckningar</h3>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
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
        <ul className="mt-4 space-y-2">
          {profile.adminNotes.map((note) => (
            <li
              key={note.id}
              className="rounded-xl border border-white/6 bg-[#121212] p-3"
            >
              {editingNoteId === note.id ? (
                <div className="flex gap-2">
                  <input
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="flex-1 rounded-lg border border-white/8 bg-black/20 px-2 py-1 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onNoteEdit(note.id, editBody);
                      setEditingNoteId(null);
                    }}
                    className="text-xs text-[#d4a574]"
                  >
                    Spara
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-white/70">{note.body}</p>
                  <div className="mt-2 flex gap-3 text-[10px] text-white/35">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setEditBody(note.body);
                      }}
                      className="hover:text-white/60"
                    >
                      Redigera
                    </button>
                    <button
                      type="button"
                      onClick={() => onNoteDelete(note.id)}
                      className="hover:text-red-300"
                    >
                      Radera
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5">
        <h3 className="font-serif text-lg text-white">Tidslinje</h3>
        <ul className="mt-4 space-y-3">
          {profile.timeline.slice(0, 25).map((event) => (
            <li key={event.id} className="flex gap-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#b85c38]" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{event.title}</p>
                  <time className="text-[10px] text-white/35">
                    {formatOrderDate(new Date(event.at))}
                  </time>
                </div>
                {event.subtitle && (
                  <p className="mt-0.5 text-xs text-white/45">{event.subtitle}</p>
                )}
                {event.amount !== undefined && event.type !== "loyalty" && (
                  <p className="mt-0.5 text-xs text-[#e8c4a8]">{event.amount} kr</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
