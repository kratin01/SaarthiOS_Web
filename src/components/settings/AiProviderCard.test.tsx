import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AiProviderCard } from './AiProviderCard';

afterEach(cleanup);

it('offers retry after settings fail and hides personal reset for a shared default', async () => {
  const api = {
    settings: vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({
      configured: true, provider: 'gemini', label: 'Gemini', model: 'test-model', source: 'shared', providers: []
    }),
    save: vi.fn(), reset: vi.fn(), models: vi.fn(), test: vi.fn()
  };
  render(<AiProviderCard api={api} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  await screen.findByText('Connected');
  expect(screen.queryByRole('button', { name: 'Remove my key' })).toBeNull();
  expect(api.settings).toHaveBeenCalledTimes(2);
});