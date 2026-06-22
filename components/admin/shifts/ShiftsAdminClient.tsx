"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Coffee, Loader2, LogIn, LogOut, Pause, Play } from "lucide-react";
import {
  clockIn,
  clockOut,
  dailySummary,
  endBreak,
  formatWorkedHours,
  getActiveShift,
  getShiftSessions,
  startBreak,
  weeklySummary,
  workedMs,
  type ShiftSession,
} from "@/lib/rms/shifts";

type StaffMe = { id: string; name: string };

function ShiftsAdminClient() {
  const [me, setMe] = useState<StaffMe | null>(null);
  const [sessions, setSessions] = useState<ShiftSession[]>([]);
  const [active, setActive] = useState<ShiftSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    if (!me) return;
    setSessions(getShiftSessions(me.id));
    setActive(getActiveShift(me.id));
  }, [me]);

  useEffect(() => {
    void fetch("/api/admin/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.id) {
          setMe({
            id: data.user.id,
            name: data.user.name ?? data.user.email ?? "Personal",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!me) return;
    queueMicrotask(refresh);
  }, [refresh, tick, me]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const onBreak = active?.breaks.some((b) => !b.endedAt) ?? false;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-white/45">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="p-8 text-center text-white/50">
        Kunde inte ladda användarinformation.
      </div>
    );
  }

  const daily = dailySummary(sessions);
  const weekly = weeklySummary(sessions);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 pb-24 pt-6 sm:px-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4a574]">
          Pass
        </p>
        <h1 className="font-serif text-3xl text-white">Skift & tid</h1>
        <p className="mt-2 text-sm text-white/45">{me.name}</p>
      </header>

      <section className="rounded-3xl border border-white/8 bg-[#141414] p-5">
        <h2 className="font-serif text-xl text-white">Aktuellt pass</h2>
        {active ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-white/50">
              Instämplad {new Date(active.clockIn).toLocaleTimeString("sv-SE")}
            </p>
            <p className="font-serif text-3xl text-[#e8c4a8]">
              {formatWorkedHours(workedMs(active))}
            </p>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                label="Stämpla ut"
                icon={LogOut}
                onClick={() => {
                  clockOut(me.id);
                  refresh();
                }}
              />
              {onBreak ? (
                <ActionButton
                  label="Avsluta rast"
                  icon={Play}
                  onClick={() => {
                    endBreak(me.id);
                    refresh();
                  }}
                />
              ) : (
                <ActionButton
                  label="Rast"
                  icon={Pause}
                  onClick={() => {
                    startBreak(me.id);
                    refresh();
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-white/45">Inte instämplad.</p>
            <ActionButton
              label="Stämpla in"
              icon={LogIn}
              className="mt-3"
              onClick={() => {
                clockIn(me.id, me.name);
                refresh();
              }}
            />
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          title="Dagens sammanfattning"
          sessions={daily.sessions}
          worked={formatWorkedHours(daily.workedMs)}
        />
        <SummaryCard
          title="Veckans sammanfattning"
          sessions={weekly.sessions}
          worked={formatWorkedHours(weekly.workedMs)}
        />
      </div>

      <section className="rounded-3xl border border-white/8 bg-[#141414] p-5">
        <h2 className="font-serif text-xl text-white">Senaste pass</h2>
        <ul className="mt-4 space-y-2">
          {sessions.slice(0, 10).map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between rounded-xl border border-white/6 bg-[#0f0f0f] px-4 py-3 text-sm"
            >
              <span className="text-white/70">
                {new Date(session.clockIn).toLocaleString("sv-SE")}
              </span>
              <span className="font-semibold text-[#e8c4a8]">
                {formatWorkedHours(workedMs(session))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  className = "",
}: {
  label: string;
  icon: typeof LogIn;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#b85c38]/35 bg-[#b85c38]/12 px-4 py-2.5 text-sm font-semibold text-[#e8c4a8] ${className}`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function SummaryCard({
  title,
  sessions,
  worked,
}: {
  title: string;
  sessions: number;
  worked: string;
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-[#141414] p-5">
      <div className="flex items-center gap-2 text-[#d4a574]">
        <Coffee size={18} />
        <h3 className="font-serif text-lg text-white">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-white/45">{sessions} pass</p>
      <p className="mt-1 font-serif text-2xl text-[#e8c4a8]">{worked}</p>
    </div>
  );
}

export default memo(ShiftsAdminClient);
