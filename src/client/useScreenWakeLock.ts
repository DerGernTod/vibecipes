import { useCallback, useEffect, useRef, useState } from 'react';

export type WakeLockStatus = 'active' | 'paused' | 'unsupported';

const isSupported = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator;

/**
 * Keeps the screen awake while mounted. The browser releases the lock whenever the tab is hidden,
 * so it is re-requested on return to the foreground. `retry` covers requests the browser refused.
 */
export function useScreenWakeLock(): { status: WakeLockStatus; retry: () => void } {
  const [status, setStatus] = useState<WakeLockStatus>(isSupported() ? 'paused' : 'unsupported');
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const wantedRef = useRef(false);

  const request = useCallback(async () => {
    if (!isSupported()) {
      setStatus('unsupported');
      return;
    }
    if (document.visibilityState !== 'visible' || sentinelRef.current) return;
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      // The component may have unmounted while the request was in flight.
      if (!wantedRef.current) {
        void sentinel.release();
        return;
      }
      sentinelRef.current = sentinel;
      sentinel.addEventListener('release', () => {
        if (sentinelRef.current === sentinel) {
          sentinelRef.current = null;
          setStatus('paused');
        }
      });
      setStatus('active');
    } catch {
      setStatus('paused');
    }
  }, []);

  useEffect(() => {
    wantedRef.current = true;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    void request();
    return () => {
      wantedRef.current = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      void sentinel?.release();
    };
  }, [request]);

  return { status, retry: () => void request() };
}
