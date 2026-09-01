/**
 * Service notices.
 *
 * `NoticeBanner` sits at the top of the app for things that affect everything.
 * `InlineNotice` goes inside a single feature, so a broken price feed is
 * explained where prices are, not as a scary site-wide alarm.
 */
import { useEffect, useState } from 'react';
import { useStatus } from '@/context/StatusContext';
import { CloseIcon } from '@/components/ui/Icons';

/** Remembered per message, so a *new* notice is never hidden by an old dismissal. */
const dismissedKey = (message: string) => `saarthios.notice.${hash(message)}`;

export function NoticeBanner() {
  const { status, offline } = useStatus();

  // The database being unreachable outranks whatever else is going on.
  const message = offline
    ? 'Cannot reach the server. Some things will not work until the connection is back.'
    : status.services.database.notice || status.notice;

  const tone = offline || !status.services.database.ok ? 'error' : 'info';
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(message ? sessionStorage.getItem(dismissedKey(message)) === '1' : false);
  }, [message]);

  if (!message || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(dismissedKey(message), '1');
    setDismissed(true);
  };

  return (
    <div
      role="status"
      className={`flex items-start gap-3 border-b px-4 py-2.5 text-sm ${
        tone === 'error'
          ? 'border-expense/25 bg-expense/10 text-ink'
          : 'border-line bg-brand-50 text-ink'
      }`}
    >
      <p className="min-w-0 flex-1">{message}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notice"
        className="shrink-0 rounded-lg p-1 text-muted transition hover:text-ink"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function InlineNotice({ message, tone = 'warn' }: { message: string; tone?: 'warn' | 'error' }) {
  if (!message) return null;

  return (
    <p
      role="status"
      className={`rounded-xl border px-3 py-2 text-sm text-ink ${
        tone === 'error' ? 'border-expense/25 bg-expense/5' : 'border-invest/25 bg-invest/5'
      }`}
    >
      {message}
    </p>
  );
}

/** Small and stable — this only has to key a sessionStorage entry. */
function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}
