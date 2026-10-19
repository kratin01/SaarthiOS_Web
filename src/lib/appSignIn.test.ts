import { expect, it, vi } from 'vitest';
import { connectionsApi } from '@/api';
import { startAppSignIn } from './appSignIn';

vi.mock('@/api', () => ({ connectionsApi: { start: vi.fn() } }));

it('never follows a sign-in address that is not HTTPS', async () => {
  vi.mocked(connectionsApi.start).mockResolvedValue('javascript:alert(1)');
  await expect(startAppSignIn('swiggy', 'chat')).rejects.toThrow('Unsafe sign-in address');
  expect(connectionsApi.start).toHaveBeenCalledWith('swiggy', 'chat');
});
