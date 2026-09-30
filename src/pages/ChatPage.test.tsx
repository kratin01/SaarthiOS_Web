import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { chatApi } from '@/api';
import { ChatPage } from './ChatPage';

vi.mock('@/api', () => ({ chatApi: { status: vi.fn(), conversations: vi.fn(), conversation: vi.fn(), send: vi.fn() } }));
vi.mock('@/context/StatusContext', () => ({ useServiceNotice: () => '' }));
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  vi.mocked(chatApi.status).mockResolvedValue({ configured: true } as Awaited<ReturnType<typeof chatApi.status>>);
  vi.mocked(chatApi.conversations).mockResolvedValue({ conversations: [], page: { limit: 30, offset: 0, total: 0, hasMore: false } });
});
afterEach(cleanup);

it('puts a suggested message in the draft without creating records', async () => {
  render(<MemoryRouter><ChatPage /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: /I spent/ }));
  expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toContain('Rapido');
  expect(chatApi.send).not.toHaveBeenCalled();
});

it('blocks duplicate sends and thread changes while a message is in flight', async () => {
  let reject!: (reason: Error) => void;
  vi.mocked(chatApi.send).mockImplementation(() => new Promise((_, fail) => { reject = fail; }));
  render(<MemoryRouter><ChatPage /></MemoryRouter>);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Spent 100 on lunch' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(screen.getByRole('button', { name: 'New chat' })).toHaveProperty('disabled', true);
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  expect(chatApi.send).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error('offline')));
  await waitFor(() => expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Spent 100 on lunch'));
});