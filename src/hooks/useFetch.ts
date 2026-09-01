/**
 * One hook for "fetch something, show a spinner, show an error".
 * Every data page uses it, so loading behaviour is identical everywhere.
 */
import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '@/api/http';

export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (err) {
      setError(errorMessage(err, 'Could not load this data.'));
    } finally {
      setLoading(false);
    }
    // `fetcher` is recreated on every render, so the caller's deps drive reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
