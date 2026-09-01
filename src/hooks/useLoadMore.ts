/**
 * "Load more" on top of `useFetch`.
 *
 * The first page comes from the normal fetch, which also carries the summary a
 * screen needs. This only owns the pages appended after it, and throws them
 * away whenever the underlying data changes — switching range, or adding and
 * deleting a row — so the list can never show a stale tail.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { errorMessage } from '@/api/http';
import type { PageInfo } from '@/types';

interface Options<T> {
  /** Rows from the first fetch. */
  first: T[];
  firstPage: PageInfo | undefined;
  /** Anything that should discard the extra pages, e.g. the selected range. */
  resetKey: unknown;
  fetchMore: (offset: number) => Promise<{ items: T[]; page: PageInfo }>;
}

export function useLoadMore<T>({ first, firstPage, resetKey, fetchMore }: Options<T>) {
  const [extra, setExtra] = useState<T[]>([]);
  const [page, setPage] = useState<PageInfo | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `total` changes whenever a row is added or removed, which is exactly when
  // the appended pages stop lining up with the first one.
  const total = firstPage?.total;

  useEffect(() => {
    setExtra([]);
    setPage(undefined);
    setError(null);
  }, [resetKey, total]);

  const items = useMemo(() => [...first, ...extra], [first, extra]);
  const current = page ?? firstPage;

  const loadMore = useCallback(async () => {
    if (!current?.hasMore || loading) return;

    setLoading(true);
    setError(null);
    try {
      const next = await fetchMore(items.length);
      setExtra((rows) => [...rows, ...next.items]);
      setPage(next.page);
    } catch (err) {
      setError(errorMessage(err, 'Could not load more.'));
    } finally {
      setLoading(false);
    }
  }, [current?.hasMore, loading, fetchMore, items.length]);

  return {
    items,
    shown: items.length,
    total: current?.total ?? items.length,
    hasMore: Boolean(current?.hasMore),
    loadingMore: loading,
    moreError: error,
    loadMore
  };
}
