/** The `Today · Week · Month` pills used above each detail dashboard. */
import type { Range } from '@/types';

const OPTIONS: { value: Range; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' }
];

export function RangePicker({
  value,
  onChange,
  options = OPTIONS
}: {
  value: Range;
  onChange: (range: Range) => void;
  options?: { value: Range; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`chip ${value === option.value ? 'chip-active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
