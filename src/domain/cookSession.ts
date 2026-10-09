import { cookSessionSchema, type CookSession, type CookTimer } from '../shared/schemas.ts';

// Pure Cook Mode state transitions. Every function takes `now` explicitly so timers stay deterministic under test.
// Timers store an absolute `endTime`; remaining time is derived from it rather than counted down.

export const COOK_SESSION_STORAGE_KEY = 'vibecipes_cook_session';
export const TIMER_EXTENSION_MS = 2 * 60 * 1000;

export type CookStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function createCookSession(recipeId: string, servings: number, system: CookSession['system']): CookSession {
  return { recipeId, servings, system, stepIndex: 0, timers: [] };
}

export function remainingMs(timer: CookTimer, now: number): number {
  return Math.max(0, timer.endTime - now);
}

export function isTimerFinished(timer: CookTimer, now: number): boolean {
  return timer.endTime <= now;
}

/** Formats a countdown as m:ss, rounding partial seconds up so a 0.4s remainder still reads 0:01. */
export function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function startTimer(
  session: CookSession,
  input: { id: string; stepIndex: number; durationSec: number; now: number },
): CookSession {
  const timer: CookTimer = {
    id: input.id,
    stepIndex: input.stepIndex,
    endTime: input.now + input.durationSec * 1000,
    alerted: false,
  };
  return { ...session, timers: [...session.timers, timer] };
}

/** Adds time to a timer. A finished timer restarts from `now`, and its alert re-arms. */
export function extendTimer(session: CookSession, id: string, extraMs: number, now: number): CookSession {
  return {
    ...session,
    timers: session.timers.map(timer =>
      timer.id === id
        ? { ...timer, endTime: Math.max(timer.endTime, now) + extraMs, alerted: false }
        : timer,
    ),
  };
}

export function dismissTimer(session: CookSession, id: string): CookSession {
  return { ...session, timers: session.timers.filter(timer => timer.id !== id) };
}

/** Finished timers whose completion has not been announced yet. */
export function dueAlerts(session: CookSession, now: number): CookTimer[] {
  return session.timers.filter(timer => !timer.alerted && isTimerFinished(timer, now));
}

export function markAlerted(session: CookSession, ids: string[]): CookSession {
  return {
    ...session,
    timers: session.timers.map(timer => (ids.includes(timer.id) ? { ...timer, alerted: true } : timer)),
  };
}

export function parseCookSession(raw: unknown): CookSession | null {
  const parsed = cookSessionSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Returns the stored session, or null when nothing is stored or the stored value is unreadable. */
export function loadCookSession(storage: CookStorage): CookSession | null {
  try {
    const raw = storage.getItem(COOK_SESSION_STORAGE_KEY);
    return raw === null ? null : parseCookSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Best effort: storage can be full or disabled, and the session still works in memory. */
export function saveCookSession(storage: CookStorage, session: CookSession): void {
  try {
    storage.setItem(COOK_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Persistence is a recovery aid; the live session keeps working without it.
  }
}

export function clearCookSession(storage: CookStorage): void {
  try {
    storage.removeItem(COOK_SESSION_STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
