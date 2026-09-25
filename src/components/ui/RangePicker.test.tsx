import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RangePicker } from './RangePicker';

const openPicker = () => fireEvent.click(screen.getByRole('button', { name: /pick a month/i }));

describe('RangePicker', () => {
  it('reports the month key when one is picked from the calendar', () => {
    const onChange = vi.fn();
    render(<RangePicker value="month" onChange={onChange} />);

    openPicker();
    fireEvent.click(screen.getByRole('button', { name: 'Aug' }));

    expect(onChange).toHaveBeenCalledWith(`${new Date().getFullYear()}-08`);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the picked month on the trigger and marks it active', () => {
    render(<RangePicker value="2026-08" onChange={() => {}} />);

    const trigger = screen.getByRole('button', { name: /august 2026/i });
    expect(trigger.className).toContain('chip-active');
    expect(screen.getByRole('button', { name: 'Month' }).className).not.toContain('chip-active');
  });

  it('stops at 2026 and refuses months that have not happened yet', () => {
    render(<RangePicker value="2026-08" onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /august 2026/i }));

    expect(screen.getByText('2026')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous year' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Dec' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Aug' })).toHaveProperty('disabled', false);
  });

  it('closes on Escape without choosing anything', () => {
    const onChange = vi.fn();
    render(<RangePicker value="month" onChange={onChange} />);

    openPicker();
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
