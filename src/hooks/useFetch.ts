/**
 * One hook for "fetch something, show a spinner, show an error".
 * Every data page uses it, so loading behaviour is identical everywhere.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '@/api/http';

export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);

  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (current === request.current) setData(result);
    } catch (err) {
      if (current === request.current) setError(errorMessage(err, 'Could not load this data.'));
    } finally {
      if (current === request.current) setLoading(false);
    }
    // `fetcher` is recreated on every render, so the caller's deps drive reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void load();
    return () => { request.current += 1; };
  }, [load]);

  return { data, loading, error, reload: load };
}
