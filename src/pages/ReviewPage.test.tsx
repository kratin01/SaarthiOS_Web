import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { reviewApi } from '@/api';
import type { MonthReview } from '@/types';
import { ReviewPage } from './ReviewPage';

vi.mock('@/api', () => ({ reviewApi: { month: vi.fn(), story: vi.fn(), refreshStory: vi.fn() } }));

const review: MonthReview = {
  month: '2026-10',
  label: 'October 2026',
  isCurrent: false,
  currency: 'INR',
  daysCovered: 31,
  money: {
    total: 12450,
    transactions: 18,
    dailyAverage: 402,
    budget: 20000,
    budgetUsedPct: 62,
    noSpendDays: 9,
    longestNoSpend: { from: '2026-10-08', to: '2026-10-11', days: 4 },
    busiestDay: { date: '2026-10-12', amount: 4200 },
    biggest: {
      amount: 3200,
      label: 'Laptop stand',
      merchant: 'Desk Co',
      category: 'shopping',
      date: '2026-10-12'
    },
    categories: [
      { category: 'groceries', amount: 6000, share: 48 },
      { category: 'shopping', amount: 3200, share: 26 }
    ],
    regular: { merchant: 'Chai Point', count: 5, amount: 600 },
    weekendShare: 35,
    viaChatShare: 80,
    previous: { total: 15000, label: 'September 2026', partial: false },
    changePct: -17
  },
  food: {
    meals: 30,
    daysLogged: 12,
    avgCalories: 1900,
    calorieGoal: 2000,
    onTargetDays: 5,
    avgProtein: 70,
    proteinGoal: 90,
    proteinGoalDays: 6,
    favourite: { name: 'Poha', count: 4 }
  },
  investing: { total: 5000, count: 1, topType: 'sip' },
  subscriptions: { monthly: 650, active: 2 },
  agents: [{ name: 'Water', icon: 'drop', entries: 20, stat: { label: 'Glasses', unit: '', total: 140 } }],
  assistant: { messages: 42 }
};

const story = {
  persona: 'The Quiet Saver',
  headline: 'You spent less than September and kept four days free of spending.',
  highlights: [{ title: 'Groceries led the way', text: 'Nearly half of the month went on groceries.' }],
  nudge: 'Try one more no-spend weekend in November.',
  generatedAt: '2026-11-01T09:00:00.000Z'
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/review?month=2026-10']}>
      <ReviewPage />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(reviewApi.month).mockResolvedValue(review);
  vi.mocked(reviewApi.story).mockResolvedValue(story);
});
afterEach(cleanup);

it('tells the month through its numbers, moments and story', async () => {
  renderPage();
  await screen.findByText('The Quiet Saver');
  expect(reviewApi.month).toHaveBeenCalledWith('2026-10');
  expect(screen.getByText(story.headline)).toBeTruthy();
  expect(screen.getByText('Down 17% on September 2026')).toBeTruthy();
  expect(screen.getByText(/Laptop stand at Desk Co/)).toBeTruthy();
  expect(screen.getByText('4 days')).toBeTruthy();
  expect(screen.getByText('Chai Point')).toBeTruthy();
  expect(screen.getByText('Poha')).toBeTruthy();
  expect(screen.getByText('Groceries')).toBeTruthy();
  expect(screen.getByText('Groceries led the way')).toBeTruthy();
  expect(screen.getByText(story.nudge)).toBeTruthy();
  expect(screen.getByText(/140 glasses/)).toBeTruthy();
});

it('copies a plain recap of the month', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  renderPage();
  await screen.findByText('The Quiet Saver');
  fireEvent.click(screen.getByRole('button', { name: /Copy recap/ }));
  await screen.findByText('Copied');
  const text = writeText.mock.calls[0][0] as string;
  expect(text).toContain('My October 2026 on SaarthiOS: The Quiet Saver');
  expect(text).toContain('Longest no-spend streak: 4 days.');
  expect(text).toContain('Next month: Try one more no-spend weekend');
});

it('still shows the numbers when the story cannot be written', async () => {
  vi.mocked(reviewApi.story).mockRejectedValue(new Error('no provider'));
  renderPage();
  await screen.findByText('Your October in numbers');
  expect(screen.getByText('Could not load this data.')).toBeTruthy();
  expect(screen.getByText('Chai Point')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Write it again' })).toBeNull();
});

it('rewrites the story on request', async () => {
  vi.mocked(reviewApi.refreshStory).mockResolvedValue({ ...story, persona: 'The Steady Planner' });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'Write it again' }));
  await screen.findByText('The Steady Planner');
  expect(reviewApi.refreshStory).toHaveBeenCalledWith('2026-10');
});

it('invites the person to start logging when the month is empty', async () => {
  vi.mocked(reviewApi.month).mockResolvedValue({
    ...review,
    money: { ...review.money, transactions: 0 },
    food: { ...review.food, meals: 0 },
    investing: { total: 0, count: 0, topType: null }
  });
  renderPage();
  await screen.findByText('Nothing logged in October 2026 yet');
  expect(screen.getByRole('link', { name: 'Open the assistant' })).toBeTruthy();
  await waitFor(() =>
    expect((screen.getByRole('button', { name: /Copy recap/ }) as HTMLButtonElement).disabled).toBe(true)
  );
});
