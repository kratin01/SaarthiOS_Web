import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { startAppSignIn } from '@/lib/appSignIn';
import type { AgentAction } from '@/types';
import { ConnectAppAction } from './ConnectAppAction';

vi.mock('@/lib/appSignIn', () => ({ startAppSignIn: vi.fn() }));

const action: AgentAction = { kind: 'connect_app', app: 'swiggy', label: 'Swiggy' };

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

it('a fresh reply opens the app sign-in once', async () => {
  vi.mocked(startAppSignIn).mockResolvedValue(undefined);
  render(<StrictMode><ConnectAppAction action={action} autoStart /></StrictMode>);

  await waitFor(() => expect(startAppSignIn).toHaveBeenCalledTimes(1));
  expect(startAppSignIn).toHaveBeenCalledWith('swiggy', 'chat');
  expect(screen.getByRole('button', { name: 'Opening Swiggy' })).toHaveProperty('disabled', true);
});

it('an older reply waits for a click and shows a failure', async () => {
  vi.mocked(startAppSignIn).mockRejectedValue(new Error('offline'));
  render(<ConnectAppAction action={action} />);

  expect(startAppSignIn).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Connect Swiggy' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Could not open Swiggy');
  expect(screen.getByRole('button', { name: 'Connect Swiggy' })).toHaveProperty('disabled', false);
});
