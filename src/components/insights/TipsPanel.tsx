/**
 * The "Tips" button that sits on every data screen.
 *
 * It reads whatever range the page is showing, sends that one word to the
 * server, and the server does the fetching — the browser never ships a pile of
 * rows to the AI.
 */
import { useState } from 'react';
import { aiApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useServiceNotice } from '@/context/StatusContext';
import { InlineNotice } from '@/components/ui/Notices';
import { Spinner } from '@/components/ui/States';
import { SparkIcon } from '@/components/ui/Icons';
import { isMonthRange, monthRangeLabel } from '@/lib/format';
import type { Range, TipsResponse } from '@/types';

interface Props {
  /** A built-in domain (`expense`, `health`, `investment`) or a custom agent slug. */
  domain: string;
  range: Range;
  accent: string;
  /** Hides the button when there is nothing worth analysing yet. */
  disabled?: boolean;
}

export function TipsPanel({ domain, range, accent, disabled = false }: Props) {
  const [result, setResult] = useState<TipsResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serviceNotice = useServiceNotice('ai');

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await aiApi.tips(domain, range));
    } catch (err) {
      setError(errorMessage(err, 'Could not get tips right now.'));
    } finally {
      setBusy(false);
    }
  };

  // Asking again after changing the range is the common case, so the button
  // stays put rather than being replaced by the results.
  const label = result ? 'Get fresh tips' : 'Get AI tips';

  return (
    <section className="card mb-6 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">Tips from your assistant</h2>
          <p className="mt-0.5 text-xs text-muted">
            {disabled
              ? 'Log a few things first and this will have something to work with.'
              : `Looks at everything on this page for ${rangeWord(range)} and suggests what to change.`}
          </p>
        </div>

        <button
          type="button"
          className="btn-ghost shrink-0"
          onClick={() => void load()}
          disabled={busy || disabled || Boolean(serviceNotice)}
        >
          {busy ? <Spinner className="h-4 w-4" /> : <SparkIcon className="h-4 w-4" />}
          {busy ? 'Thinking' : label}
        </button>
      </div>

      {serviceNotice && (
        <div className="mt-3">
          <InlineNotice message={serviceNotice} />
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      {result && !error && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-sm text-ink">{result.headline}</p>

          {result.tips.length > 0 && (
            <ul className="mt-3 space-y-3">
              {result.tips.map((tip, index) => (
                <li key={index} className="flex gap-3">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: accent }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{tip.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{tip.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-muted">
            Generated from your own numbers. Treat it as a prompt to think, not advice.
          </p>
        </div>
      )}
    </section>
  );
}

const RANGE_WORDS: Record<string, string> = {
  today: 'today',
  week: 'the last 7 days',
  month: 'this month',
  last_month: 'last month',
  year: 'this year',
  all: 'all time'
};

const rangeWord = (range: Range) =>
  isMonthRange(range) ? monthRangeLabel(range) : (RANGE_WORDS[range] ?? 'this period');
