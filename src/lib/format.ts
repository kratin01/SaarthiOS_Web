/** Display helpers: money, dates, labels. Presentation only, no logic. */

export function formatMoney(amount: number, currency = 'INR', compact = false): string {
  const symbol = currencySymbol(currency);
  if (compact && Math.abs(amount) >= 1000) {
    const value = new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
    return `${symbol}${value}`;
  }
  return `${symbol}${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;
}

export function currencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    RUB: '₽'
  };
  return symbols[currency] ?? `${currency} `;
}

const MONTH_RANGE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** `2026-08` — one calendar month, used as a range of its own. */
export const isMonthRange = (value: string) => MONTH_RANGE.test(value);

/** `2026-08` → `August 2026`. */
export const monthRangeLabel = (value: string) => {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });
};

/** `31 Aug` — short and scannable in lists and axes. */
export const formatDay = (value: string | Date) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** `Aug 2026` — used on the investment chart. */
export const formatMonth = (value: string) => {
  const [year, month] = value.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-IN', {
    month: 'short',
    year: '2-digit'
  });
};

/** "Today", "Yesterday", or a short date. */
export function formatRelativeDay(value: string | Date): string {
  const date = new Date(value);
  const today = new Date();
  const days = Math.round(
    (new Date(today.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86_400_000
  );
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDay(date);
}

export const formatTime = (value: string | Date) =>
  new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

/** `liquid_fund` → `Liquid Fund` */
export const labelise = (value: string): string =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value}%`;

/** Ten muted tones for charts, warm to cool, so they sit calmly together. */
export const CHART_COLORS = [
  '#4E7C6B',
  '#C08457',
  '#6B87A8',
  '#8FA98A',
  '#B98A9C',
  '#7E9BB0',
  '#C9A66B',
  '#6E9C84',
  '#9A8FB0',
  '#A8B0A2'
];
