import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { adminApi } from '@/api';
import type { AdminOverview, AdminPerson, AdminSort } from '@/types';
import { AdminPage } from './AdminPage';

vi.mock('@/api', () => ({ adminApi: { overview: vi.fn(), ai: {} } }));
vi.mock('@/components/charts/Charts', () => ({ BarsChart: () => null }));
vi.mock('@/components/settings/AiProviderCard', () => ({
  AiProviderCard: ({ title }: { title: string }) => <p>{title}</p>
}));

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const person = (name: string, lastActiveAt: string | null, joinedAt: string): AdminPerson => ({
  id: name.toLowerCase(),
  name,
  email: `${name.toLowerCase()}@example.test`,
  joinedAt,
  signedInWith: name === 'Bob' ? 'google' : 'password',
  lastActiveAt,
  records: lastActiveAt ? 3 : 0,
  expenses: lastActiveAt ? 2 : 0,
  meals: 0,
  investments: 0,
  subscriptions: lastActiveAt ? 1 : 0,
  entries: 0,
  messages: lastActiveAt ? 5 : 0,
  agents: 0
});

const bob = person('Bob', daysAgo(0), daysAgo(20));
const amy = person('Amy', daysAgo(3), daysAgo(2));
const cy = person('Cy', null, daysAgo(1));

function overview(days: number, sort: AdminSort): AdminOverview {
  return {
    generatedAt: new Date().toISOString(),
    windowDays: days,
    users: { total: 3, newInWindow: days === 7 ? 2 : 3, activeInWindow: 2, neverUsed: 1 },
    people: sort === 'active' ? [bob, amy, cy] : [cy, amy, bob],
    page: { limit: 7, offset: 0, total: 3, hasMore: false },
    totals: { expenses: 4, meals: 0, investments: 0, subscriptions: 2, entries: 0, messages: 10, agents: 0 },
    ai: {
      runs: 40,
      failed: 10,
      failureRate: 25,
      recentFailures: [
        {
          reason: 'Free tiers allow only a few requests a minute \u2014 wait a moment and try again.',
          count: 7,
          lastAt: daysAgo(1)
        }
      ]
    },
    signupsByDay: [],
    messagesByDay: []
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminApi.overview).mockImplementation(async (days = 30, _offset = 0, sort = 'active') =>
    overview(days, sort)
  );
});
afterEach(cleanup);

const tableNames = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].querySelector('p')?.textContent);

it('lists people by recent activity and can switch to newest signups', async () => {
  render(<AdminPage />);
  await waitFor(() => expect(tableNames()).toEqual(['Bob', 'Amy', 'Cy']));
  expect(adminApi.overview).toHaveBeenLastCalledWith(30, 0, 'active');
  expect(screen.getByRole('button', { name: 'Recently active' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getAllByText('Never').length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole('button', { name: 'Newest' }));
  await waitFor(() => expect(tableNames()).toEqual(['Cy', 'Amy', 'Bob']));
  expect(adminApi.overview).toHaveBeenLastCalledWith(30, 0, 'joined');
});

it('labels every number with its period and shows failures without dashes', async () => {
  render(<AdminPage />);
  const activity = await screen.findByRole('region', { name: 'Activity' });
  expect(within(activity).getByText(/The last 30 days\./)).toBeTruthy();
  expect(within(activity).getByText('10 of 40 messages')).toBeTruthy();
  expect(
    within(activity).getByText('Free tiers allow only a few requests a minute, wait a moment and try again.')
  ).toBeTruthy();
  expect(within(activity).getByText('7 times')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'People' }).textContent).toContain('1 signed up and never used it.');
  expect(screen.getByRole('region', { name: 'All time' }).textContent).toContain('Custom agent entries');
  expect(document.body.textContent).not.toMatch(/[\u2013\u2014]/);

  fireEvent.click(within(activity).getByRole('button', { name: '7 days' }));
  await waitFor(() => expect(within(activity).getByText(/The last 7 days\./)).toBeTruthy());
  expect(adminApi.overview).toHaveBeenLastCalledWith(7, 0, 'active');
});

it('keeps the last numbers on screen when a refresh fails', async () => {
  render(<AdminPage />);
  await waitFor(() => expect(tableNames()).toEqual(['Bob', 'Amy', 'Cy']));
  vi.mocked(adminApi.overview).mockRejectedValueOnce(new Error('offline'));

  fireEvent.click(screen.getByRole('button', { name: 'Newest' }));
  const alert = await screen.findByRole('alert');
  expect(alert.textContent).toContain('Showing the last numbers that loaded.');
  expect(tableNames()).toEqual(['Bob', 'Amy', 'Cy']);

  fireEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(tableNames()).toEqual(['Cy', 'Amy', 'Bob']));
  expect(screen.queryByRole('alert')).toBeNull();
});
