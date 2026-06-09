"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
  initialNote: string | null;
};

export default function OrderAdminNote({ orderId, initialNote }: Props) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: note.trim() || null }),
      });

      if (!res.ok) throw new Error();

      setSaved(true);
      router.refresh();
    } catch {
      setError("Kunde inte spara anteckningen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        rows={4}
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        placeholder="Intern anteckning — syns bara för admin…"
        className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#b85c38]/50 resize-none"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {saved && (
        <p className="text-green-400 text-sm">Anteckning sparad.</p>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto px-6 bg-[#b85c38] hover:bg-[#9e4e2f] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition text-sm"
      >
        {saving ? "Sparar…" : "Spara anteckning"}
      </button>
    </div>
  );
}
