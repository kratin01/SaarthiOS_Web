/**
 * The inspiration card on the Overview. The chosen style is saved on the
 * account, and the refresh button asks the insight agent for a new line.
 */
import { useState } from 'react';
import { authApi, dashboardApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { Spinner } from '@/components/ui/States';
import { RepeatIcon } from '@/components/ui/Icons';
import { INSPIRATION_KINDS, inspirationLabel } from '@/lib/overview';
import { plainPunctuation } from '@/lib/format';
import type { Inspiration, InspirationKind } from '@/types';

export function InspirationCard({ className = '' }: { className?: string }) {
  const { user, setUser } = useAuth();
  const initial = useFetch(() => dashboardApi.inspiration(), []);
  const [fresh, setFresh] = useState<Inspiration | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kind = user?.inspirationKind ?? 'affirmation';
  const line = fresh ?? initial.data;
  const failure = error ?? (line ? null : initial.error);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (err) {
      setError(errorMessage(err, 'Could not get a new line right now. Try again in a moment.'));
    } finally {
      setBusy(false);
    }
  };

  const showAnother = () =>
    run(async () => {
      setFresh(await dashboardApi.refreshInspiration());
    });

  // The server writes the new line in the saved style, so save first.
  const changeKind = (next: InspirationKind) =>
    run(async () => {
      setUser(await authApi.updateProfile({ inspirationKind: next }));
      setFresh(await dashboardApi.refreshInspiration());
    });

  return (
    <section className={`card flex flex-col px-5 py-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">
          {line ? inspirationLabel(line.kind) : 'Daily inspiration'}
        </h2>
        <div className="flex items-center gap-1.5">
          <label htmlFor="inspiration-kind" className="sr-only">
            What to show
          </label>
          <select
            id="inspiration-kind"
            value={kind}
            onChange={(event) => void changeKind(event.target.value as InspirationKind)}
            disabled={busy}
            className="input w-auto py-1.5 text-xs"
          >
            {INSPIRATION_KINDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void showAnother()}
            disabled={busy || initial.loading}
            className="btn-quiet p-2"
            aria-label="Show another"
            title="Show another"
          >
            {busy ? <Spinner className="h-4 w-4" /> : <RepeatIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mt-3 flex-1">
        {initial.loading && !line ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Spinner className="h-4 w-4" />
            Finding something good for today
          </p>
        ) : line ? (
          <figure className={`max-w-3xl transition ${busy ? 'opacity-60' : ''}`}>
            {line.original && (
              <p className="mb-2 text-sm italic leading-relaxed text-muted">{line.original}</p>
            )}
            <blockquote className="text-base font-medium leading-relaxed text-ink sm:text-lg">
              {plainPunctuation(line.text)}
            </blockquote>
            {line.author && (
              <figcaption className="mt-2 text-sm text-muted">{plainPunctuation(line.author)}</figcaption>
            )}
            {line.meaning && (
              <p className="mt-3 text-sm text-muted">{plainPunctuation(line.meaning)}</p>
            )}
            {line.link && (
              <a
                href={line.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs text-brand-700 underline-offset-2 hover:underline"
              >
                Source: {line.link.title}
              </a>
            )}
          </figure>
        ) : null}

        {failure && (
          <p className="mt-2 rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
            {failure}
          </p>
        )}
      </div>
    </section>
  );
}
