import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DeleteButton } from './DeleteButton';

afterEach(cleanup);

it('only deletes after confirmation and keeps failures available for retry', async () => {
  const remove = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
  render(<DeleteButton label="expense" onDelete={remove} />);
  fireEvent.click(screen.getByRole('button', { name: 'Delete expense' }));
  expect(remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Keep entry' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Delete expense' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await screen.findByRole('alert');
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(remove).toHaveBeenCalledTimes(2);
});