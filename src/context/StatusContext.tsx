/**
 * Whether the parts of the app that depend on the outside world are working.
 *
 * Polled rather than fetched once, so a notice you set while someone has the
 * app open reaches them without a reload — and clears itself the same way.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { metaApi } from '@/api';
import type { AppStatus } from '@/types';

const POLL_MS = 60_000;

/** Used until the first response, and if the server cannot be reached at all. */
const UNKNOWN: AppStatus = {
  notice: '',
  services: {
    database: { ok: true, notice: '' },
    ai: { ok: true, configured: true, provider: '', model: '', notice: '' },
    prices: { ok: true, notice: '' },
    import: { ok: true, notice: '' },
    google: { enabled: false }
  }
};

interface StatusValue {
  status: AppStatus;
  /** True when the API itself could not be reached. */
  offline: boolean;
  refresh: () => Promise<void>;
}

const StatusContext = createContext<StatusValue | null>(null);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AppStatus>(UNKNOWN);
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await metaApi.status());
      setOffline(false);
    } catch (error) {
      setStatus(UNKNOWN);
      // A reply of any kind means the server is up — an older build that has no
      // /status yet would otherwise be reported to users as an outage. Only a
      // request that never got a response counts as offline.
      const reachable = axios.isAxiosError(error) && Boolean(error.response);
      setOffline(!reachable);
    }
  }, []);

  useEffect(() => {
    void refresh();

    // Only poll while the tab is actually being looked at. A background tab
    // asking every minute forever is wasted work on both ends.
    const tick = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const timer = window.setInterval(tick, POLL_MS);

    // Coming back to the tab is exactly when a stale notice is most misleading.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const value = useMemo(() => ({ status, offline, refresh }), [status, offline, refresh]);

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
}

export function useStatus() {
  const value = useContext(StatusContext);
  if (!value) throw new Error('useStatus must be used inside StatusProvider');
  return value;
}

/** The one sentence a given feature should show, or '' when all is well. */
export function useServiceNotice(service: 'ai' | 'prices' | 'import' | 'database') {
  const { status, offline } = useStatus();
  if (offline) return 'Cannot reach the server right now. Check your connection and try again.';
  return status.services[service].notice;
}
