import { expect, it } from 'vitest';
import { defaultReviewMonth, reviewNudge } from './review';

it('opens on the month that just finished during the first week', () => {
  expect(defaultReviewMonth(new Date(2026, 10, 3))).toBe('2026-10');
  expect(defaultReviewMonth(new Date(2026, 0, 7))).toBe('2025-12');
  expect(defaultReviewMonth(new Date(2026, 10, 8))).toBe('2026-11');
});

it('points to the review only around the turn of the month', () => {
  expect(reviewNudge(new Date(2026, 10, 2))).toEqual({
    month: '2026-10',
    text: 'Your October in review is ready'
  });
  expect(reviewNudge(new Date(2026, 9, 28))).toEqual({
    month: '2026-10',
    text: 'See how October is shaping up'
  });
  expect(reviewNudge(new Date(2026, 9, 15))).toBeNull();
});
