import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { authApi } from '@/api';
import { Tutorial } from './Tutorial';

const auth = vi.hoisted(() => ({ user: { _id: 'new', currency: 'INR', tutorialStatus: 'pending' as string | undefined }, setUser: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@/api', () => ({ authApi: { updateProfile: vi.fn() } }));
const mount = () => render(<MemoryRouter><Tutorial key={auth.user._id} /></MemoryRouter>);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  auth.user = { _id: 'new', currency: 'INR', tutorialStatus: 'pending' };
  vi.mocked(authApi.updateProfile).mockRejectedValue(new Error('offline'));
});
afterEach(cleanup);

describe('Tutorial', () => {
  it('opens for new accounts, skips immediately offline, and stays skipped on reload', async () => {
    const view = mount();
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(authApi.updateProfile).toHaveBeenCalledWith({ tutorialStatus: 'skipped' });
    view.unmount();
    mount();
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(localStorage.getItem('saarthios.tutorial.new')).toBe('skipped'));
  });

  it('never interrupts existing accounts and can be replayed', () => {
    auth.user.tutorialStatus = undefined;
    mount();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Quick tour' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('previews examples without writes, navigates both ways, and saves completion', async () => {
    vi.mocked(authApi.updateProfile).mockResolvedValue({ ...auth.user, tutorialStatus: 'completed' } as Awaited<ReturnType<typeof authApi.me>>);
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Preview example' }));
    expect(authApi.updateProfile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Step 1 of 5')).toBeTruthy();
    for (let step = 0; step < 4; step += 1) fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(auth.setUser).toHaveBeenCalled());
    expect(authApi.updateProfile).toHaveBeenCalledWith({ tutorialStatus: 'completed' });
  });

  it('keeps dismissals isolated between accounts', () => {
    localStorage.setItem('saarthios.tutorial.other', 'skipped');
    mount();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});