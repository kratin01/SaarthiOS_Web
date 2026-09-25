/** Downloads whatever period the screen is currently showing, as a spreadsheet. */
import { useState } from 'react';
import { errorMessage } from '@/api/http';
import { DownloadIcon } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/States';
import { isMonthRange, monthRangeLabel } from '@/lib/format';
import type { Range } from '@/types';

const RANGE_WORDS: Record<string, string> = {
  today: 'today',
  week: 'the last 7 days',
  month: 'this month',
  last_month: 'last month',
  year: 'this year',
  all: 'everything'
};

export function ReportButton({
  download,
  range,
  empty = false
}: {
  download: (range: Range) => Promise<void>;
  range: Range;
  /** No rows in this period, so there is nothing worth downloading. */
  empty?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const period = isMonthRange(range) ? monthRangeLabel(range) : (RANGE_WORDS[range] ?? 'this period');

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await download(range);
    } catch (err) {
      setError(errorMessage(err, 'Could not build the report.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {error && <span className="text-xs text-expense">{error}</span>}
      <button
        type="button"
        className="btn-ghost"
        onClick={() => void run()}
        disabled={busy || empty}
        title={empty ? 'Nothing recorded in this period' : `Download ${period} as an Excel file`}
      >
        {busy ? <Spinner className="h-4 w-4" /> : <DownloadIcon className="h-4 w-4" />}
        Excel report
      </button>
    </div>
  );
}
