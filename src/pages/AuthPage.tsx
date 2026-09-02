/** Sign in and sign up share one calm, centred layout. */
import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useFetch } from '@/hooks/useFetch';
import { useStatus } from '@/context/StatusContext';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { EyeIcon, EyeOffIcon } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/States';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register, loginWithGoogle } = useAuth();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: providers, error: providersError } = useFetch(() => authApi.providers(), []);
  const { status } = useStatus();
  const isRegister = mode === 'register';
  const google = providers?.google;

  if (user) return <Navigate to={location.state?.from ?? '/'} replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isRegister) await register(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err, 'Could not sign you in.'));
    } finally {
      setBusy(false);
    }
  };

  const submitGoogle = async (credential: string) => {
    setBusy(true);
    setError(null);
    try {
      await loginWithGoogle(credential);
    } catch (err) {
      setError(errorMessage(err, 'Could not sign you in with Google.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500">
            <span className="h-3.5 w-3.5 rounded-full bg-canvas" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {isRegister ? 'Create your space' : 'Welcome back'}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {isRegister
              ? 'One quiet place for your money, meals and investments.'
              : 'Pick up where you left off.'}
          </p>
        </div>

        <div className="card space-y-4 p-6">
          {/* Signing in is exactly when someone needs to be told the service is
              having trouble, so these notices matter more here than anywhere. */}
          {(status.notice || status.services.database.notice) && (
            <p className="rounded-xl border border-invest/25 bg-invest/5 px-3 py-2 text-sm text-ink">
              {status.services.database.notice || status.notice}
            </p>
          )}

          {/* Without this the page just quietly loses its Google button when the
              API is down, which looks like a bug rather than an outage. */}
          {providersError && (
            <p className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
              Cannot reach the server, so sign-in options may be missing. Check that the API is
              running, then reload.
            </p>
          )}

          {/* Outside the <form>: Google's rendered markup must never submit it. */}
          {google?.enabled && (
            <>
              <GoogleButton
                clientId={google.clientId}
                onCredential={(credential) => void submitGoogle(credential)}
                onError={setError}
                disabled={busy}
              />
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="text-xs text-muted">or</span>
                <span className="h-px flex-1 bg-line" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  minLength={2}
                />
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                  minLength={isRegister ? 8 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  // Not focusable: tabbing from the field should reach the submit
                  // button, and the toggle is still reachable by pointer.
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {isRegister && <p className="mt-1.5 text-xs text-muted">At least 8 characters.</p>}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy && <Spinner className="h-4 w-4" />}
              {isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {error && (
            <p className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
              {error}
            </p>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          {isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <Link
            to={isRegister ? '/login' : '/register'}
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            {isRegister ? 'Sign in' : 'Create one'}
          </Link>
        </p>
      </div>
    </div>
  );
}
