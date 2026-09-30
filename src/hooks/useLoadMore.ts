/**
 * "Load more" on top of `useFetch`.
 *
 * The first page comes from the normal fetch, which also carries the summary a
 * screen needs. This only owns the pages appended after it, and throws them
 * away whenever the underlying data changes — switching range, or adding and
 * deleting a row — so the list can never show a stale tail.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  const request = useRef(0);
  const pending = useRef(false);

  useEffect(() => {
    request.current += 1;
    pending.current = false;
    setExtra([]);
    setPage(undefined);
    setError(null);
    setLoading(false);
    return () => { request.current += 1; };
  }, [resetKey, firstPage]);

  const items = useMemo(() => [...first, ...extra], [first, extra]);
  const current = page ?? firstPage;

  const loadMore = useCallback(async () => {
    if (!current?.hasMore || pending.current) return;

    const currentRequest = ++request.current;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchMore(items.length);
      if (currentRequest !== request.current) return;
      setExtra((rows) => [...rows, ...next.items]);
      setPage(next.page);
    } catch (err) {
      if (currentRequest === request.current) setError(errorMessage(err, 'Could not load more.'));
    } finally {
      if (currentRequest === request.current) {
        pending.current = false;
        setLoading(false);
      }
    }
  }, [current?.hasMore, fetchMore, items.length]);

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
