import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { subscriptionApi } from '@/api';
import { SubscriptionsPage } from './SubscriptionsPage';

vi.mock('@/api', () => ({ subscriptionApi: { list: vi.fn(), update: vi.fn(), remove: vi.fn() } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { currency: 'INR' } }) }));
vi.mock('@/components/insights/TipsPanel', () => ({ TipsPanel: () => null }));
vi.mock('@/components/charts/Charts', () => ({ DonutChart: () => null, Legend: () => null }));

const summary = {
  monthly: 200, yearly: 2400, daily: 6.5, paidToDate: 200, activeCount: 2, cancelledCount: 0,
  longestRunning: [], byCategory: [], upcoming: [], dueThisMonth: 0, dueThisMonthCount: 0, shareOfSpending: null
};
const item = { _id: 'one', name: 'Music plan', amount: 100, monthly: 100, yearly: 1200, cycle: 'monthly' as const, category: 'music', startedOn: '2026-09-01', endedOn: null, note: '', source: 'manual' as const, active: true, charges: 1, paidToDate: 100, nextChargeOn: null };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(subscriptionApi.list).mockImplementation(async (status = 'all', offset = 0) => ({
    summary,
    items: status === 'cancelled' ? [] : offset ? [{ ...item, _id: 'two', name: 'Cloud plan' }] : [item],
    page: { limit: 1, offset, total: status === 'cancelled' ? 0 : 2, hasMore: status !== 'cancelled' && offset === 0 }
  }));
});
afterEach(cleanup);

it('loads subscriptions beyond the first page and resets when filtering', async () => {
  render(<SubscriptionsPage />);
  await screen.findByText('Music plan');
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
  await screen.findByText('Cloud plan');
  expect(subscriptionApi.list).toHaveBeenCalledWith('all', 1);
  expect(screen.getByText('Showing 2 of 2 subscriptions')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancelled' }));
  await screen.findByText('No cancelled subscriptions');
  expect(screen.queryByText('Cloud plan')).toBeNull();
});

it('surfaces a failed cancellation without removing the subscription', async () => {
  vi.mocked(subscriptionApi.update).mockRejectedValue(new Error('offline'));
  render(<SubscriptionsPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel Music plan' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Could not update'));
  expect(screen.getByText('Music plan')).toBeTruthy();
});