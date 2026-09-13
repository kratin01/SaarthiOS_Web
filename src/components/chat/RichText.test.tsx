import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichText, hasTable } from './RichText';

describe('RichText', () => {
  it('renders a table from pipes', () => {
    const reply = [
      'Here are your transport expenses.',
      '',
      '| Date | Merchant | Amount |',
      '| --- | --- | --- |',
      '| 3 Sept | Rapido | INR 180 |',
      '| 5 Sept | Uber | INR 530 |'
    ].join('\n');

    render(<RichText text={reply} />);

    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Date',
      'Merchant',
      'Amount'
    ]);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('Rapido')).toBeTruthy();
    expect(screen.getByText('Here are your transport expenses.')).toBeTruthy();
  });

  it('leaves ordinary prose alone', () => {
    render(<RichText text={'You spent INR 710 on transport.\nThat is 12% of the month.'} />);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText(/You spent INR 710 on transport/)).toBeTruthy();
  });

  it('renders bullets and bold', () => {
    render(<RichText text={'- **Food** was highest\n- Transport was second'} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Food').tagName).toBe('STRONG');
  });

  it('never turns markup into live HTML', () => {
    const nasty = 'Careful <img src=x onerror="alert(1)"> and <script>alert(2)</script>';
    const { container } = render(<RichText text={nasty} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>alert(2)</script>');
  });

  it('knows when a reply contains a table', () => {
    expect(hasTable('| a | b |\n| --- | --- |\n| 1 | 2 |')).toBe(true);
    expect(hasTable('no table here | just a pipe')).toBe(false);
  });
});
