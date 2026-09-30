import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useFetch } from './useFetch';
import { useLoadMore } from './useLoadMore';

afterEach(cleanup);

it('ignores a late response from the previous range', async () => {
  let finishOld!: (value: string) => void;
  const old = new Promise<string>((resolve) => { finishOld = resolve; });
  const fetcher = vi.fn().mockReturnValueOnce(old).mockResolvedValueOnce('new range');
  const { result, rerender } = renderHook(({ range }) => useFetch(fetcher, [range]), { initialProps: { range: 'week' } });
  rerender({ range: 'month' });
  await waitFor(() => expect(result.current.data).toBe('new range'));
  await act(async () => finishOld('old range'));
  expect(result.current.data).toBe('new range');
  expect(result.current.loading).toBe(false);
});

it('clears appended rows on a fresh first page even when the count has not changed', async () => {
  const firstPage = { limit: 1, offset: 0, total: 3, hasMore: true };
  const fetchMore = vi.fn().mockResolvedValue({ items: ['second'], page: { ...firstPage, offset: 1 } });
  const { result, rerender } = renderHook(({ page }) => useLoadMore({ first: ['first'], firstPage: page, resetKey: 'month', fetchMore }), { initialProps: { page: firstPage } });
  await act(async () => { await result.current.loadMore(); });
  expect(result.current.items).toEqual(['first', 'second']);
  rerender({ page: { ...firstPage } });
  expect(result.current.items).toEqual(['first']);
});

it('discards an old load-more result after the range changes', async () => {
  const firstPage = { limit: 1, offset: 0, total: 3, hasMore: true };
  let finish!: (value: { items: string[]; page: typeof firstPage }) => void;
  const fetchMore = () => new Promise<{ items: string[]; page: typeof firstPage }>((resolve) => { finish = resolve; });
  const { result, rerender } = renderHook(({ range }) => useLoadMore({ first: ['first'], firstPage, resetKey: range, fetchMore }), { initialProps: { range: 'month' } });
  act(() => { void result.current.loadMore(); });
  rerender({ range: 'week' });
  await act(async () => finish({ items: ['stale'], page: firstPage }));
  expect(result.current.items).toEqual(['first']);
  expect(result.current.loadingMore).toBe(false);
});