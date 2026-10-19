/** The sign-in button an agent reply can carry, for linking an app such as Swiggy. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '@/api/http';
import { Spinner } from '@/components/ui/States';
import { startAppSignIn } from '@/lib/appSignIn';
import type { AgentAction } from '@/types';

export function ConnectAppAction({ action, autoStart = false }: { action: AgentAction; autoStart?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const open = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await startAppSignIn(action.app, 'chat');
    } catch (err) {
      setError(errorMessage(err, `Could not open ${action.label}. Try again.`));
      setBusy(false);
    }
  }, [action.app, action.label]);

  // A reply that just arrived continues straight to sign-in; older ones wait for a click.
  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    void open();
  }, [autoStart, open]);

  return (
    <div className="space-y-2">
      <button type="button" className="btn-primary" onClick={() => void open()} disabled={busy}>
        {busy && <Spinner className="h-4 w-4" />}
        {busy ? `Opening ${action.label}` : `Connect ${action.label}`}
      </button>
      {error && (
        <p role="alert" className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
