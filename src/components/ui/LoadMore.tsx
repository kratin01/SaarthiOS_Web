/**
 * The footer under a paginated list: how much you are seeing, and a way to
 * see the rest. Renders nothing when everything already fits.
 */
import { Spinner } from '@/components/ui/States';

interface Props {
  shown: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  error?: string | null;
  onMore: () => void;
  /** Plural noun for the rows, e.g. "transactions". */
  noun?: string;
}

export function LoadMore({ shown, total, hasMore, loading, error, onMore, noun = 'items' }: Props) {
  if (!hasMore && shown <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
      <p className="text-xs text-muted">
        Showing {shown} of {total} {noun}
      </p>

      <div className="flex items-center gap-3">
        {error && <span className="text-xs text-expense">{error}</span>}
        {hasMore && (
          <button type="button" className="btn-ghost" onClick={onMore} disabled={loading}>
            {loading && <Spinner className="h-4 w-4" />}
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
