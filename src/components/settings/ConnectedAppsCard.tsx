/** Linking apps such as Swiggy, so the assistant can turn orders into records. */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { connectionsApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useFetch } from '@/hooks/useFetch';
import { Card } from '@/components/ui/Card';
import { ErrorState, Loading, Spinner } from '@/components/ui/States';
import { formatRelativeDay } from '@/lib/format';
import { startAppSignIn } from '@/lib/appSignIn';
import type { AppConnectionStatus, ConnectedApp } from '@/types';

const STATUS: Record<AppConnectionStatus, { text: string; style: string }> = {
  connected: { text: 'Connected', style: 'border-health/30 bg-health/10 text-ink' },
  expired: { text: 'Sign-in expired', style: 'border-expense/30 bg-expense/10 text-ink' },
  disconnected: { text: 'Not connected', style: 'border-line bg-canvas text-muted' },
  unavailable: { text: 'Not available yet', style: 'border-line bg-canvas text-muted' }
};

export function ConnectedAppsCard() {
  const { data, loading, error, reload } = useFetch(() => connectionsApi.list(), []);
  const [apps, setApps] = useState<ConnectedApp[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const [justConnected] = useState(() => params.get('connected'));

  // Read once, then dropped, so a refresh does not announce it again.
  useEffect(() => {
    if (params.has('connected')) setParams({}, { replace: true });
  }, [params, setParams]);

  const list = apps ?? data;
  const connectedLabel = list?.find((app) => app.id === justConnected)?.label;

  const connect = async (app: ConnectedApp) => {
    setBusy(app.id);
    setActionError(null);
    try {
      await startAppSignIn(app.id, 'settings');
    } catch (err) {
      setActionError(errorMessage(err, `Could not open ${app.label}. Try again.`));
      setBusy(null);
    }
  };

  const disconnect = async (app: ConnectedApp) => {
    setBusy(app.id);
    setActionError(null);
    try {
      setApps(await connectionsApi.disconnect(app.id));
    } catch (err) {
      setActionError(errorMessage(err, `Could not disconnect ${app.label}. Try again.`));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card title="Connected apps" description="Bring in what you already order elsewhere">
      {loading && !list ? (
        <Loading label="Loading apps" />
      ) : error && !list ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="space-y-4">
          {connectedLabel && (
            <p role="status" className="rounded-xl border border-health/25 bg-health/5 px-3 py-2 text-sm text-ink">
              {connectedLabel} is connected. Ask the assistant to add your latest {connectedLabel} order.
            </p>
          )}

          <ul className="divide-y divide-line">
            {list?.map((app) => (
              <li key={app.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-semibold text-brand-700"
                >
                  {app.label.charAt(0)}
                </span>
                <div className="min-w-0 flex-1 basis-36">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                    {app.label}
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS[app.status].style}`}>
                      {STATUS[app.status].text}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {app.status === 'unavailable' ? app.note : app.description}
                    {app.status !== 'unavailable' && app.lastImportedAt &&
                      ` Last order added ${formatRelativeDay(app.lastImportedAt).toLowerCase()}.`}
                  </p>
                </div>

                {app.status === 'connected' && (
                  <button
                    type="button"
                    className="btn-ghost"
                    disabled={busy !== null}
                    onClick={() => void disconnect(app)}
                  >
                    {busy === app.id && <Spinner className="h-4 w-4" />}
                    Disconnect
                  </button>
                )}
                {(app.status === 'disconnected' || app.status === 'expired') && (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy !== null}
                    onClick={() => void connect(app)}
                  >
                    {busy === app.id && <Spinner className="h-4 w-4" />}
                    {app.status === 'expired' ? 'Reconnect' : 'Connect'}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {actionError && (
            <p role="alert" className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
              {actionError}
            </p>
          )}
          <p className="text-xs text-muted">
            You sign in on the app's own page; SaarthiOS never sees your password. Once connected, say
            "add my latest Swiggy order" in the assistant.
          </p>
        </div>
      )}
    </Card>
  );
}
