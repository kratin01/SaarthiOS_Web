/** Where an app's sign-in page sends the browser back, with a one-time code. */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { connectionsApi } from '@/api';
import { errorMessage } from '@/api/http';
import { Page } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/States';

export function ConnectCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // The code works once, and React runs effects twice in development.
    if (started.current) return;
    started.current = true;

    const code = params.get('code');
    const state = params.get('state');
    if (params.get('error') || !code || !state) {
      setError(
        params.get('error') === 'access_denied'
          ? 'Sign-in was cancelled, so nothing was connected.'
          : 'The sign-in did not finish, so nothing was connected.'
      );
      return;
    }

    connectionsApi
      .complete(state, code)
      .then(({ app, returnTo }) =>
        navigate(`/${returnTo === 'chat' ? 'chat' : 'settings'}?connected=${encodeURIComponent(app)}`, {
          replace: true
        })
      )
      .catch((err) => setError(errorMessage(err, 'Could not finish connecting. Try again from Settings.')));
  }, [params, navigate]);

  return (
    <Page>
      <Card className="mx-auto max-w-md">
        {error ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-ink">Not connected</p>
            <p role="alert" className="mx-auto mt-1 max-w-xs text-sm text-muted">
              {error}
            </p>
            <Link to="/settings" className="btn-primary mt-4">
              Back to Settings
            </Link>
          </div>
        ) : (
          <Loading label="Finishing the connection" />
        )}
      </Card>
    </Page>
  );
}
