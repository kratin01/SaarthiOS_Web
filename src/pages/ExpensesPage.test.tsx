import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { expenseApi } from '@/api';
import { ExpensesPage } from './ExpensesPage';
import type { Expense } from '@/types';

vi.mock('@/api', () => ({
  expenseApi: { list: vi.fn(), report: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  authApi: { me: vi.fn() }
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { currency: 'INR', customCategories: [] }, setUser: vi.fn() })
}));
vi.mock('@/components/insights/TipsPanel', () => ({ TipsPanel: () => null }));
vi.mock('@/components/import/ImportModal', () => ({ ImportModal: () => null }));
vi.mock('@/components/charts/Charts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/charts/Charts')>()),
  TrendChart: () => null,
  BarsChart: () => null,
  DonutChart: () => null
}));

const soda: Expense = {
  _id: 'soda', amount: 50, category: 'food', merchant: '', note: 'Sweet lime soda',
  date: '2026-10-30T12:00:00.000Z', source: 'chat'
};
const dinner: Expense = {
  _id: 'dinner', amount: 500, category: 'friends outing', merchant: 'Phoenix MarketCity',
  note: 'Dinner', date: '2026-10-25T12:00:00.000Z', source: 'chat'
};

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  vi.mocked(expenseApi.list).mockImplementation(async (_range = 'month', offset = 0, category) => {
    const items = category ? [dinner].filter((row) => row.category === category) : [soda, dinner];
    return {
      items,
      // Like the real API: rows follow the category, the summary always covers the whole period.
      summary: {
        range: 'this month',
        total: 550,
        count: 2,
        byCategory: [
          { category: 'friends outing', amount: 500, count: 1 },
          { category: 'food', amount: 50, count: 1 }
        ],
        byDay: [],
        topMerchants: []
      },
      page: { limit: 7, offset, total: items.length, hasMore: false }
    };
  });
});
afterEach(cleanup);

it('opens one category with its notes and goes back to everything', async () => {
  render(<ExpensesPage />);
  // A row without a merchant is named by its note rather than repeating the category.
  expect(await screen.findByText('Sweet lime soda')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: /Friends outing/ }));
  expect(await screen.findByText('Friends outing transactions')).toBeTruthy();
  expect(expenseApi.list).toHaveBeenCalledWith('month', 0, 'friends outing');
  expect(screen.getByText('1 transaction, ₹500 this month')).toBeTruthy();
  expect(screen.getByText(/· Dinner/)).toBeTruthy();
  expect(screen.queryByText('Sweet lime soda')).toBeNull();
  // The stats above still describe the whole month.
  expect(screen.getByText('₹550')).toBeTruthy();
  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'Show all' }));
  expect(await screen.findByText('Sweet lime soda')).toBeTruthy();
  expect(screen.getByText('Transactions')).toBeTruthy();
});

it('the category picker on the list reaches categories outside the chart legend', async () => {
  render(<ExpensesPage />);
  await screen.findByText('Sweet lime soda');
  fireEvent.change(screen.getByLabelText('Show category'), { target: { value: 'food' } });
  expect(await screen.findByText('Food transactions')).toBeTruthy();
  expect(expenseApi.list).toHaveBeenCalledWith('month', 0, 'food');
});
