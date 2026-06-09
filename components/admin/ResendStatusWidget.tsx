"use client";

import { CheckCircle2, Mail, XCircle } from "lucide-react";

type Props = {
  configured: boolean;
  fromAddress: string;
  fromEmailEnv: string | null;
  restaurantEmail: string;
  loading?: boolean;
};

export default function ResendStatusWidget({
  configured,
  fromAddress,
  fromEmailEnv,
  restaurantEmail,
  loading,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-5 animate-pulse h-32" />
    );
  }

  return (
    <section className="rounded-3xl border border-white/8 bg-gradient-to-b from-[#1a1a1a] to-[#141414] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#d4a574]">
            Resend
          </p>
          <h2 className="mt-1 font-serif text-xl text-white">E-poststatus</h2>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            configured
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {configured ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-white/40 shrink-0" />
          <span className="text-white/50">API-nyckel:</span>
          <span className={configured ? "text-emerald-400" : "text-red-400"}>
            {configured ? "Konfigurerad" : "Saknas"}
          </span>
        </div>
        <p className="text-xs text-white/45 pl-6">
          Avsändare: <span className="text-white/70">{fromAddress}</span>
        </p>
        {fromEmailEnv && (
          <p className="text-xs text-white/45 pl-6">
            Env: <span className="text-white/70">{fromEmailEnv}</span>
          </p>
        )}
        <p className="text-xs text-white/45 pl-6">
          Restaurang: <span className="text-white/70">{restaurantEmail}</span>
        </p>
      </div>
    </section>
  );
}
