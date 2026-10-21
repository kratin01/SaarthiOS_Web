import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { authApi, dashboardApi } from '@/api';
import { InspirationCard } from './InspirationCard';
import { CustomiseOverview } from './CustomiseOverview';
import type { Inspiration, User } from '@/types';

const auth = vi.hoisted(() => ({
  user: { _id: 'u1', inspirationKind: 'affirmation', overviewCards: undefined as string[] | undefined },
  setUser: vi.fn()
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@/context/AgentsContext', () => ({
  useAgents: () => ({
    agents: [
      { _id: 'a1', name: 'Workouts', active: true },
      { _id: 'a2', name: 'Paused', active: false }
    ]
  })
}));
vi.mock('@/api', () => ({
  authApi: { updateProfile: vi.fn() },
  dashboardApi: { inspiration: vi.fn(), refreshInspiration: vi.fn() }
}));

const line = (text: string, extra: Partial<Inspiration> = {}): Inspiration => ({
  requested: 'affirmation', kind: 'affirmation', text, author: '', original: '', meaning: '',
  link: null, generatedAt: '2026-10-21T08:00:00Z', ...extra
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.user = { _id: 'u1', inspirationKind: 'affirmation', overviewCards: undefined };
  vi.mocked(dashboardApi.inspiration).mockResolvedValue(line('I move at my own pace.'));
});
afterEach(cleanup);

describe('InspirationCard', () => {
  it('shows today\'s line and a new one on refresh', async () => {
    vi.mocked(dashboardApi.refreshInspiration).mockResolvedValue(line('I choose what matters today.'));
    render(<InspirationCard />);
    expect(await screen.findByText('I move at my own pace.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show another' }));
    expect(await screen.findByText('I choose what matters today.')).toBeTruthy();
  });

  it('saves a new kind before asking for a line in it, and shows Gita details and sources', async () => {
    const saved = { ...auth.user, inspirationKind: 'gita' } as unknown as User;
    vi.mocked(authApi.updateProfile).mockResolvedValue(saved);
    vi.mocked(dashboardApi.refreshInspiration).mockResolvedValue(line('You have a right to your work.', {
      requested: 'gita', kind: 'gita', author: 'Bhagavad Gita 2.47', original: 'karmanye vadhikaraste',
      meaning: 'Do the work well and let go of the outcome.',
      link: { title: 'Verse 2.47', url: 'https://example.org/2-47' }
    }));
    render(<InspirationCard />);
    await screen.findByText('I move at my own pace.');

    fireEvent.change(screen.getByLabelText('What to show'), { target: { value: 'gita' } });
    expect(await screen.findByText('You have a right to your work.')).toBeTruthy();
    expect(authApi.updateProfile).toHaveBeenCalledWith({ inspirationKind: 'gita' });
    expect(vi.mocked(authApi.updateProfile).mock.invocationCallOrder[0])
      .toBeLessThan(vi.mocked(dashboardApi.refreshInspiration).mock.invocationCallOrder[0]);
    expect(auth.setUser).toHaveBeenCalledWith(saved);
    expect(screen.getByText('karmanye vadhikaraste')).toBeTruthy();
    expect(screen.getByText('Bhagavad Gita 2.47')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Source: Verse 2.47' }).getAttribute('rel'))
      .toBe('noopener noreferrer');
  });

  it('keeps the card usable when a refresh fails', async () => {
    vi.mocked(dashboardApi.refreshInspiration).mockRejectedValue(new Error('offline'));
    render(<InspirationCard />);
    await screen.findByText('I move at my own pace.');
    fireEvent.click(screen.getByRole('button', { name: 'Show another' }));
    expect(await screen.findByText(/Could not get a new line/)).toBeTruthy();
    expect(screen.getByText('I move at my own pace.')).toBeTruthy();
  });
});

describe('CustomiseOverview', () => {
  it('starts from the defaults and saves the chosen cards in display order', async () => {
    vi.mocked(authApi.updateProfile).mockResolvedValue(auth.user as unknown as User);
    const onClose = vi.fn();
    render(<CustomiseOverview onClose={onClose} />);

    expect((screen.getByLabelText(/Spent/) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(/Protein/) as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByText('Paused')).toBeNull();

    fireEvent.click(screen.getByLabelText(/Workouts/));
    fireEvent.click(screen.getByLabelText(/Protein/));
    fireEvent.click(screen.getByLabelText(/Recent activity/));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(authApi.updateProfile).toHaveBeenCalledWith({
      overviewCards: [
        'inspiration', 'insights', 'spent', 'calories', 'protein',
        'spending_trend', 'calories_trend', 'categories', 'agent:a1'
      ]
    });
  });
});
