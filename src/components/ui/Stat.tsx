/** The big number tiles at the top of every dashboard. */
import type { ReactNode } from 'react';

interface StatProps {
  label: string;
  value: string;
  hint?: string;
  change?: number | null;
  icon?: ReactNode;
  accent?: string;
  /** 0–100. Draws a thin progress bar under the value. */
  progress?: number | null;
}

export function Stat({ label, value, hint, change, icon, accent = '#4E7C6B', progress }: StatProps) {
  return (
    <div className="card p-5 transition hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        {icon && (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}14`, color: accent }}
          >
            {icon}
          </span>
        )}
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</p>

      {typeof progress === 'number' && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: accent }}
          />
        </div>
      )}

      <div className="mt-2 flex items-center gap-2 text-xs">
        {typeof change === 'number' && change !== 0 && (
          <span className={change > 0 ? 'text-expense' : 'text-health'}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
        {hint && <span className="text-muted">{hint}</span>}
      </div>
    </div>
  );
}
