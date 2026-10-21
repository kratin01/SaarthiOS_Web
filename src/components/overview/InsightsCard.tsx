/**
 * The insight agent's notes on the Overview, drawn as the same quiet tone pills
 * the Overview always had. Written at most once a day per period on the server.
 */
import { useState } from 'react';
import { dashboardApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useFetch } from '@/hooks/useFetch';
import { RepeatIcon } from '@/components/ui/Icons';
import { formatTime, plainPunctuation } from '@/lib/format';
import type { DashboardPeriod, OverviewInsights } from '@/types';

const TONE_STYLES: Record<string, string> = {
  good: 'border-health/25 bg-health/5',
  neutral: 'border-line bg-canvas',
  warn: 'border-expense/25 bg-expense/5',
  alert: 'border-expense/40 bg-expense/10'
};

const GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';

interface Props {
  period: DashboardPeriod;
}

/** Keyed by period so a refreshed set never shows under the other period. */
export function InsightsCard(props: Props) {
  return <InsightsContent key={props.period} {...props} />;
}

function InsightsContent({ period }: Props) {
  const initial = useFetch(() => dashboardApi.insights(period), [period]);
  const [fresh, setFresh] = useState<OverviewInsights | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = fresh ?? initial.data;
  const failure = error ?? (data ? null : initial.error);

  const refresh = async () => {
    setBusy(true);
    setError(null);
    try {
      setFresh(await dashboardApi.refreshInsights(period));
    } catch (err) {
      setError(errorMessage(err, 'Could not refresh the insights right now.'));
    } finally {
      setBusy(false);
    }
  };

  const caption =
    failure ??
    (data?.notice ||
      (data?.source === 'ai' ? `From your insight agent at ${formatTime(data.generatedAt)}` : ''));

  if (initial.loading && !data) {
    return (
      <div className={`mb-6 ${GRID}`}>
        <p className="sr-only">Loading insights</p>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`h-16 animate-pulse rounded-xl border border-line bg-canvas ${
              index ? 'hidden sm:block' : ''
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      {data && data.insights.length > 0 && (
        <ul className={`${GRID} transition ${busy ? 'opacity-60' : ''}`}>
          {data.insights.map((insight, index) => (
            <li
              key={index}
              className={`rounded-xl border px-4 py-3 text-sm text-ink ${TONE_STYLES[insight.tone]}`}
            >
              {plainPunctuation(insight.text)}
              {insight.link && (
                <a
                  href={insight.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-xs text-muted underline-offset-2 hover:underline"
                >
                  Source: {insight.link.title}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex items-center justify-end gap-3 text-xs text-muted">
        {caption && <span className="min-w-0 text-right">{caption}</span>}
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-1 py-0.5 transition hover:text-ink disabled:opacity-60"
        >
          <RepeatIcon className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
          {busy ? 'Refreshing' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}
