export type ShiftBreak = {
  startedAt: string;
  endedAt: string | null;
};

export type ShiftSession = {
  id: string;
  userId: string;
  userName: string;
  clockIn: string;
  clockOut: string | null;
  breaks: ShiftBreak[];
};

const STORAGE_KEY = "rms-shift-sessions";

function readAll(): ShiftSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShiftSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(sessions: ShiftSession[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getShiftSessions(userId?: string): ShiftSession[] {
  const sessions = readAll();
  return userId ? sessions.filter((s) => s.userId === userId) : sessions;
}

export function getActiveShift(userId: string): ShiftSession | null {
  return (
    getShiftSessions(userId).find((s) => s.clockOut === null) ?? null
  );
}

export function clockIn(userId: string, userName: string): ShiftSession {
  const existing = getActiveShift(userId);
  if (existing) return existing;

  const session: ShiftSession = {
    id: crypto.randomUUID(),
    userId,
    userName,
    clockIn: new Date().toISOString(),
    clockOut: null,
    breaks: [],
  };
  writeAll([session, ...readAll()]);
  return session;
}

export function clockOut(userId: string): ShiftSession | null {
  const sessions = readAll();
  const index = sessions.findIndex(
    (s) => s.userId === userId && s.clockOut === null
  );
  if (index === -1) return null;

  const activeBreak = sessions[index].breaks.find((b) => !b.endedAt);
  if (activeBreak) activeBreak.endedAt = new Date().toISOString();

  sessions[index] = {
    ...sessions[index],
    clockOut: new Date().toISOString(),
  };
  writeAll(sessions);
  return sessions[index];
}

export function startBreak(userId: string): ShiftSession | null {
  const sessions = readAll();
  const index = sessions.findIndex(
    (s) => s.userId === userId && s.clockOut === null
  );
  if (index === -1) return null;
  if (sessions[index].breaks.some((b) => !b.endedAt)) return sessions[index];

  sessions[index].breaks.push({
    startedAt: new Date().toISOString(),
    endedAt: null,
  });
  writeAll(sessions);
  return sessions[index];
}

export function endBreak(userId: string): ShiftSession | null {
  const sessions = readAll();
  const index = sessions.findIndex(
    (s) => s.userId === userId && s.clockOut === null
  );
  if (index === -1) return null;

  const breakIndex = sessions[index].breaks.findIndex((b) => !b.endedAt);
  if (breakIndex === -1) return sessions[index];

  sessions[index].breaks[breakIndex] = {
    ...sessions[index].breaks[breakIndex],
    endedAt: new Date().toISOString(),
  };
  writeAll(sessions);
  return sessions[index];
}

function breakMs(breaks: ShiftBreak[]): number {
  return breaks.reduce((sum, b) => {
    if (!b.endedAt) return sum;
    return (
      sum +
      Math.max(0, new Date(b.endedAt).getTime() - new Date(b.startedAt).getTime())
    );
  }, 0);
}

export function workedMs(session: ShiftSession, now = Date.now()): number {
  const end = session.clockOut ? new Date(session.clockOut).getTime() : now;
  const start = new Date(session.clockIn).getTime();
  return Math.max(0, end - start - breakMs(session.breaks));
}

export function formatWorkedHours(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function dailySummary(
  sessions: ShiftSession[],
  date = new Date()
): { sessions: number; workedMs: number } {
  const key = date.toISOString().slice(0, 10);
  const daySessions = sessions.filter((s) => s.clockIn.slice(0, 10) === key);
  return {
    sessions: daySessions.length,
    workedMs: daySessions.reduce((sum, s) => sum + workedMs(s), 0),
  };
}

export function weeklySummary(
  sessions: ShiftSession[],
  date = new Date()
): { sessions: number; workedMs: number } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const weekSessions = sessions.filter((s) => {
    const t = new Date(s.clockIn).getTime();
    return t >= start.getTime() && t < end.getTime();
  });

  return {
    sessions: weekSessions.length,
    workedMs: weekSessions.reduce((sum, s) => sum + workedMs(s), 0),
  };
}
