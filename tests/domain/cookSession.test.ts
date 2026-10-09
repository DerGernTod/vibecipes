import { describe, it, expect } from 'vitest';
import {
  COOK_SESSION_STORAGE_KEY,
  TIMER_EXTENSION_MS,
  clearCookSession,
  createCookSession,
  dismissTimer,
  dueAlerts,
  extendTimer,
  formatCountdown,
  isTimerFinished,
  loadCookSession,
  markAlerted,
  parseCookSession,
  remainingMs,
  saveCookSession,
  startTimer,
  type CookStorage,
} from '../../src/domain/cookSession.ts';
import type { CookSession } from '../../src/shared/schemas.ts';

function memoryStorage(): CookStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const T0 = 1_000_000;

function sessionWithTimer(durationSec = 60): CookSession {
  return startTimer(createCookSession('r1', 4, 'metric'), { id: 'a', stepIndex: 2, durationSec, now: T0 });
}

describe('cook session timers', () => {
  it('stores an absolute end time derived from the start time', () => {
    const session = sessionWithTimer(90);
    expect(session.timers).toEqual([{ id: 'a', stepIndex: 2, endTime: T0 + 90_000, alerted: false }]);
  });

  it('derives remaining time from timestamps, so a backgrounded tab stays accurate', () => {
    const timer = sessionWithTimer(60).timers[0];
    // The tab slept for 45s: the timer must report what is left, not what a tick counter would say.
    expect(remainingMs(timer, T0 + 45_000)).toBe(15_000);
    expect(isTimerFinished(timer, T0 + 45_000)).toBe(false);
  });

  it('clamps remaining time at zero once the timer has ended', () => {
    const timer = sessionWithTimer(60).timers[0];
    expect(remainingMs(timer, T0 + 75_000)).toBe(0);
    expect(isTimerFinished(timer, T0 + 60_000)).toBe(true);
  });

  it('reports a due alert only once per completion', () => {
    const session = sessionWithTimer(60);
    expect(dueAlerts(session, T0 + 59_999)).toEqual([]);
    const due = dueAlerts(session, T0 + 61_000);
    expect(due.map(timer => timer.id)).toEqual(['a']);

    const announced = markAlerted(session, due.map(timer => timer.id));
    expect(dueAlerts(announced, T0 + 61_000)).toEqual([]);
    expect(announced.timers[0].alerted).toBe(true);
  });

  it('extends a running timer from its end time', () => {
    const extended = extendTimer(sessionWithTimer(60), 'a', TIMER_EXTENSION_MS, T0 + 10_000);
    expect(extended.timers[0].endTime).toBe(T0 + 60_000 + TIMER_EXTENSION_MS);
  });

  it('restarts a finished timer from now and re-arms its alert', () => {
    const finished = markAlerted(sessionWithTimer(60), ['a']);
    const extended = extendTimer(finished, 'a', TIMER_EXTENSION_MS, T0 + 100_000);
    expect(extended.timers[0]).toEqual({ id: 'a', stepIndex: 2, endTime: T0 + 100_000 + TIMER_EXTENSION_MS, alerted: false });
  });

  it('removes a dismissed timer and leaves the others', () => {
    let session = startTimer(sessionWithTimer(60), { id: 'b', stepIndex: 3, durationSec: 30, now: T0 });
    session = dismissTimer(session, 'a');
    expect(session.timers.map(timer => timer.id)).toEqual(['b']);
  });
});

describe('formatCountdown', () => {
  it('formats m:ss', () => {
    expect(formatCountdown(125_000)).toBe('2:05');
    expect(formatCountdown(9_000)).toBe('0:09');
  });

  it('rounds partial seconds up so a running timer never shows 0:00 early', () => {
    expect(formatCountdown(400)).toBe('0:01');
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(-5)).toBe('0:00');
  });
});

describe('cook session persistence', () => {
  const valid: CookSession = {
    recipeId: 'r1',
    servings: 4,
    system: 'imperial',
    stepIndex: 1,
    timers: [{ id: 'a', stepIndex: 1, endTime: T0, alerted: true }],
  };

  it('round-trips a session through storage', () => {
    const storage = memoryStorage();
    saveCookSession(storage, valid);
    expect(storage.data.has(COOK_SESSION_STORAGE_KEY)).toBe(true);
    expect(loadCookSession(storage)).toEqual(valid);
  });

  it('returns null when nothing is stored', () => {
    expect(loadCookSession(memoryStorage())).toBeNull();
  });

  it('returns null for corrupt JSON instead of throwing', () => {
    const storage = memoryStorage();
    storage.setItem(COOK_SESSION_STORAGE_KEY, '{not json');
    expect(loadCookSession(storage)).toBeNull();
  });

  it('rejects stored data that no longer matches the schema', () => {
    expect(parseCookSession({ ...valid, system: 'cups' })).toBeNull();
    expect(parseCookSession({ ...valid, stepIndex: -1 })).toBeNull();
    expect(parseCookSession({ ...valid, timers: [{ id: 'a' }] })).toBeNull();
    expect(parseCookSession(null)).toBeNull();
  });

  it('clears the stored session', () => {
    const storage = memoryStorage();
    saveCookSession(storage, valid);
    clearCookSession(storage);
    expect(loadCookSession(storage)).toBeNull();
  });

  it('does not throw when storage rejects writes', () => {
    const failing: CookStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(() => saveCookSession(failing, valid)).not.toThrow();
    expect(() => clearCookSession(failing)).not.toThrow();
  });
});

describe('createCookSession', () => {
  it('starts at the first step with no timers', () => {
    expect(createCookSession('r9', 2, 'metric')).toEqual({ recipeId: 'r9', servings: 2, system: 'metric', stepIndex: 0, timers: [] });
  });
});
