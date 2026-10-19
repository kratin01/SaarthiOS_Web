import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { connectionsApi } from '@/api';
import { startAppSignIn } from '@/lib/appSignIn';
import type { ConnectedApp } from '@/types';
import { ConnectedAppsCard } from './ConnectedAppsCard';

vi.mock('@/api', () => ({ connectionsApi: { list: vi.fn(), disconnect: vi.fn() } }));
vi.mock('@/lib/appSignIn', () => ({ startAppSignIn: vi.fn() }));

const swiggy: ConnectedApp = {
  id: 'swiggy',
  label: 'Swiggy',
  description: 'Food orders become an expense and a meal.',
  status: 'disconnected',
  note: '',
  connectedAt: null,
  lastImportedAt: null
};
const zomato: ConnectedApp = {
  ...swiggy,
  id: 'zomato',
  label: 'Zomato',
  status: 'unavailable',
  note: 'Zomato does not let other apps connect yet.'
};

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

it('connects through the app sign-in and explains apps that cannot connect', async () => {
  vi.mocked(connectionsApi.list).mockResolvedValue([swiggy, zomato]);
  vi.mocked(startAppSignIn).mockRejectedValue(new Error('offline'));
  render(<MemoryRouter><ConnectedAppsCard /></MemoryRouter>);

  expect(await screen.findByText('Zomato does not let other apps connect yet.')).toBeTruthy();
  expect(screen.getAllByRole('button')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
  expect(startAppSignIn).toHaveBeenCalledWith('swiggy', 'settings');
  expect((await screen.findByRole('alert')).textContent).toContain('Could not open Swiggy');
});

it('announces a finished connection and can disconnect', async () => {
  vi.mocked(connectionsApi.list).mockResolvedValue([{ ...swiggy, status: 'connected' }]);
  vi.mocked(connectionsApi.disconnect).mockResolvedValue([swiggy]);
  render(
    <MemoryRouter initialEntries={['/settings?connected=swiggy']}>
      <ConnectedAppsCard />
    </MemoryRouter>
  );

  expect((await screen.findByRole('status')).textContent).toContain('Swiggy is connected');
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
  expect(await screen.findByRole('button', { name: 'Connect' })).toBeTruthy();
  expect(connectionsApi.disconnect).toHaveBeenCalledWith('swiggy');
});
