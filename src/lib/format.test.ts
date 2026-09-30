import { describe, expect, it } from 'vitest';
import { plainPunctuation } from './format';

describe('plainPunctuation', () => {
  it('turns dash pauses into natural punctuation', () => {
    expect(plainPunctuation('Meal logged \u2014 roti (2), dal.')).toBe('Meal logged, roti (2), dal.');
    expect(plainPunctuation('Food\u2014the biggest share\u2014is 40%.')).toBe('Food, the biggest share, is 40%.');
    expect(plainPunctuation('Now tracking Netflix \u2014')).toBe('Now tracking Netflix');
    expect(plainPunctuation('Spend less \u2014.')).toBe('Spend less.');
    expect(plainPunctuation('Spent more \u2013 mostly food')).toBe('Spent more, mostly food');
  });

  it('keeps bullets, empty table cells and number ranges readable', () => {
    expect(plainPunctuation('\u2014 Food\n\u2014 Travel')).toBe('- Food\n- Travel');
    expect(plainPunctuation('| Rapido | \u2014 |')).toBe('| Rapido | - |');
    expect(plainPunctuation('Aim for 2\u20134 meals, 8 \u2014 12 g.')).toBe('Aim for 2-4 meals, 8-12 g.');
  });

  it('leaves normal hyphens and words alone', () => {
    const text = 'Well-known merchant, INR 1,200 on 2026-09-30.';
    expect(plainPunctuation(text)).toBe(text);
  });
});
