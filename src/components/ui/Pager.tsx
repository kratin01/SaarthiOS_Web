/**
 * Numbered pages for tables.
 *
 * Lists elsewhere use "Load more", which suits a feed you scan. A table you are
 * auditing is different: you want to know how many pages there are and to jump
 * back to one you already looked at.
 */
interface Props {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
  noun?: string;
}

/** Current page, its neighbours, and the ends, with gaps collapsed. */
function pagesToShow(current: number, last: number) {
  const wanted = new Set([1, last, current, current - 1, current + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);

  const out: (number | 'gap')[] = [];
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) out.push('gap');
    out.push(page);
  });
  return out;
}

export function Pager({ offset, limit, total, onChange, noun = 'rows' }: Props) {
  const last = Math.max(1, Math.ceil(total / limit));
  const current = Math.floor(offset / limit) + 1;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  if (total <= limit) {
    return (
      <p className="border-t border-line px-5 py-3 text-xs text-muted">
        {total} {noun}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
      <p className="text-xs text-muted">
        {from}-{to} of {total} {noun}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn-quiet px-2.5 py-1 text-xs"
          onClick={() => onChange(Math.max(0, offset - limit))}
          disabled={current === 1}
        >
          Back
        </button>

        {pagesToShow(current, last).map((page, index) =>
          page === 'gap' ? (
            <span key={`gap-${index}`} className="px-1 text-xs text-muted">
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onChange((page - 1) * limit)}
              className={`min-w-[28px] rounded-lg px-2 py-1 text-xs transition ${
                page === current ? 'brand-solid font-medium' : 'text-muted hover:bg-canvas hover:text-ink'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          className="btn-quiet px-2.5 py-1 text-xs"
          onClick={() => onChange(offset + limit)}
          disabled={current === last}
        >
          Next
        </button>
      </div>
    </div>
  );
}
