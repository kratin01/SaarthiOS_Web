import { StrictMode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { connectionsApi } from '@/api';
import { ConnectCallbackPage } from './ConnectCallbackPage';

vi.mock('@/api', () => ({ connectionsApi: { complete: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function Where() {
  const location = useLocation();
  return <p>{location.pathname + location.search}</p>;
}

const renderAt = (url: string) =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/callback" element={<ConnectCallbackPage />} />
          <Route path="/chat" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </StrictMode>
  );

it('finishes the sign-in exactly once and returns to where it started', async () => {
  vi.mocked(connectionsApi.complete).mockResolvedValue({ app: 'swiggy', label: 'Swiggy', returnTo: 'chat' });
  renderAt('/callback?code=abc&state=state-123');

  expect(await screen.findByText('/chat?connected=swiggy')).toBeTruthy();
  expect(connectionsApi.complete).toHaveBeenCalledTimes(1);
  expect(connectionsApi.complete).toHaveBeenCalledWith('state-123', 'abc');
});

it('a cancelled sign-in connects nothing and says so', async () => {
  renderAt('/callback?error=access_denied&state=state-123');

  expect((await screen.findByRole('alert')).textContent).toContain('cancelled');
  expect(connectionsApi.complete).not.toHaveBeenCalled();
  expect(screen.getByRole('link', { name: 'Back to Settings' }).getAttribute('href')).toBe('/settings');
});
