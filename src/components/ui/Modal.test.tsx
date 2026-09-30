import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Modal } from './Modal';

afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

describe('Modal', () => {
  it('contains keyboard focus and uses the latest close handler without resetting focus', () => {
    const close = vi.fn();
    const { rerender } = render(
      <Modal open title="Edit" onClose={() => {}}><input aria-label="Name" /><button>Save</button></Modal>
    );
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }));
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
    screen.getByRole('textbox').focus();
    rerender(<Modal open title="Edit" onClose={close}><input aria-label="Name" /><button>Save</button></Modal>);
    expect(document.activeElement).toBe(screen.getByRole('textbox'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).toHaveBeenCalledOnce();
  });

  it('restores the trigger focus and original scroll state on close', () => {
    document.body.style.overflow = 'auto';
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const { rerender } = render(<Modal open title="Edit" onClose={() => {}}>Form</Modal>);
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<Modal open={false} title="Edit" onClose={() => {}}>Form</Modal>);
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('auto');
    trigger.remove();
  });
});