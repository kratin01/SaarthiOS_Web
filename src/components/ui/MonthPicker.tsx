/** A small calendar popover for picking one month to look at. */
import { useEffect, useRef, useState } from 'react';
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { isMonthRange, monthRangeLabel } from '@/lib/format';

/** Nothing was tracked before this, so there is nothing to look at further back. */
const FIRST_YEAR = 2026;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

/** Matches `w-60` below. Used to work out which edge to hang the panel from. */
const PANEL_WIDTH = 240;

export function MonthPicker({
  value,
  onChange
}: {
  /** The current range. Anything that is not a month key reads as "nothing picked". */
  value: string;
  onChange: (month: string) => void;
}) {
  const selected = isMonthRange(value) ? value : '';
  const now = new Date();
  const lastYear = Math.max(FIRST_YEAR, now.getFullYear());

  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [year, setYear] = useState(() => (selected ? Number(selected.slice(0, 4)) : lastYear));
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      // Reopening always lands on the month you are looking at, not where you left off.
      setYear(selected ? Number(selected.slice(0, 4)) : lastYear);
      // Hanging the panel off the left of a chip near the right edge would push
      // the whole page sideways, so it flips to the other edge instead.
      const left = wrapper.current?.getBoundingClientRect().left ?? 0;
      setAlignRight(left + PANEL_WIDTH > window.innerWidth - 16);
    }
    setOpen(!open);
  };

  const pick = (index: number) => {
    onChange(`${year}-${String(index + 1).padStart(2, '0')}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapper}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`chip ${selected ? 'chip-active' : ''}`}
      >
        <CalendarIcon className="h-3.5 w-3.5" />
        {selected ? monthRangeLabel(selected) : 'Pick a month'}
        <ChevronDownIcon className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pick a month"
          className={`absolute top-full z-30 mt-2 w-60 max-w-[calc(100vw-2rem)] animate-fade-up rounded-2xl border border-line bg-surface p-3 shadow-lift ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setYear(year - 1)}
              disabled={year <= FIRST_YEAR}
              aria-label="Previous year"
              className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-ink">{year}</span>
            <button
              type="button"
              onClick={() => setYear(year + 1)}
              disabled={year >= lastYear}
              aria-label="Next year"
              className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((month, index) => {
              const key = `${year}-${String(index + 1).padStart(2, '0')}`;
              // A month that has not happened yet can only ever be empty.
              const ahead = year === now.getFullYear() && index > now.getMonth();
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => pick(index)}
                  disabled={ahead}
                  aria-pressed={key === selected}
                  className={`rounded-xl px-2 py-2 text-xs font-medium transition ${
                    key === selected ? 'brand-solid' : 'text-ink hover:bg-canvas'
                  } disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted/40`}
                >
                  {month}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
