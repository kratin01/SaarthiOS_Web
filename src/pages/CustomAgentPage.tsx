/**
 * The page for a user-built agent.
 *
 * Nothing here is hardcoded to a particular agent: the columns, the stat cards
 * and the add form are all generated from `agent.fields`, which is the schema
 * the user designed in Settings.
 */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { agentApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useFetch } from '@/hooks/useFetch';
import { useLoadMore } from '@/hooks/useLoadMore';
import { Page, PageHeader } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { Modal } from '@/components/ui/Modal';
import { RangePicker } from '@/components/ui/RangePicker';
import { EmptyState, ErrorState, Loading, Spinner } from '@/components/ui/States';
import { LoadMore } from '@/components/ui/LoadMore';
import { TipsPanel } from '@/components/insights/TipsPanel';
import { PencilIcon, PlusIcon, TrashIcon, agentIcon } from '@/components/ui/Icons';
import { TrendChart } from '@/components/charts/Charts';
import { formatDay, formatRelativeDay } from '@/lib/format';
import type { CustomAgent, CustomAgentField, CustomEntry, Range } from '@/types';

const ACCENT = '#8E7CC3';

export function CustomAgentPage() {
  const { slug = '' } = useParams();
  const [range, setRange] = useState<Range>('month');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CustomEntry | null>(null);

  const { data, loading, error, reload } = useFetch(
    () => agentApi.entries(slug, range),
    [slug, range]
  );

  const rows = useLoadMore({
    first: data?.items ?? [],
    firstPage: data?.page,
    resetKey: `${slug}|${range}`,
    fetchMore: (offset) => agentApi.entries(slug, range, offset)
  });

  const remove = async (id: string) => {
    await agentApi.removeEntry(id);
    void reload();
  };

  const Icon = agentIcon(data?.agent.icon ?? 'spark');
  const numberFields = data?.agent.fields.filter((f) => f.type === 'number') ?? [];
  const chartKey = numberFields[0]?.key ?? 'count';

  return (
    <Page>
      <PageHeader
        title={data?.agent.name ?? 'Agent'}
        subtitle={data?.agent.description || 'Everything this agent has logged for you.'}
        action={
          <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
            <PlusIcon className="h-4 w-4" />
            Add entry
          </button>
        }
      />

      <div className="mb-6">
        <RangePicker value={range} onChange={setRange} />
      </div>

      <TipsPanel domain={slug} range={range} accent={ACCENT} disabled={!data?.items.length} />

      {loading ? (
        <Loading label="Loading entries" />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat
              label={`Entries ${data.summary.range}`}
              value={String(data.summary.count)}
              icon={<Icon className="h-4 w-4" />}
              accent={ACCENT}
            />
            {data.summary.totals.map((stat) => (
              <Stat
                key={stat.key}
                label={`Total ${stat.label.toLowerCase()}`}
                value={`${stat.total}${stat.unit ? ` ${stat.unit}` : ''}`}
                hint={`${stat.average} average per entry`}
                accent={ACCENT}
              />
            ))}
          </div>

          {data.summary.byDay.length > 0 && (
            <Card
              title={numberFields[0] ? `${numberFields[0].label} over time` : 'Entries over time'}
              className="mb-6"
            >
              <TrendChart
                data={data.summary.byDay}
                xKey="date"
                yKey={chartKey}
                color={ACCENT}
                height={220}
                formatX={formatDay}
              />
            </Card>
          )}

          <Card title="Entries" bodyClassName="p-0 sm:p-0">
            {rows.items.length ? (
              <>
                <ul className="divide-y divide-line">
                  {rows.items.map((item) => (
                    <li key={item._id} className="group flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                        <p className="truncate text-xs text-muted">
                          {describeValues(data.agent, item.values)}
                          {item.note && ` · ${item.note}`}
                          {item.source === 'chat' && ' · via chat'}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs text-muted">{formatRelativeDay(item.date)}</p>
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        aria-label={`Edit ${item.title}`}
                        className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-canvas hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(item._id)}
                        aria-label="Delete entry"
                        className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-canvas hover:text-expense focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>

                <LoadMore
                  shown={rows.shown}
                  total={rows.total}
                  hasMore={rows.hasMore}
                  loading={rows.loadingMore}
                  error={rows.moreError}
                  onMore={() => void rows.loadMore()}
                  noun="entries"
                />
              </>
            ) : (
              <EmptyState
                title="Nothing logged yet"
                description={`Add one by hand, or just tell the assistant — it knows about ${
                  data.agent.name
                }.`}
              />
            )}
          </Card>

          <EntryModal
            key={editing?._id ?? 'new'}
            agent={data.agent}
            existing={editing}
            open={adding || editing !== null}
            onClose={() => {
              setAdding(false);
              setEditing(null);
            }}
            onSaved={() => {
              setAdding(false);
              setEditing(null);
              void reload();
            }}
          />
        </>
      )}
    </Page>
  );
}

/** "5 km · 32 mins" — only the stats that were actually filled in. */
function describeValues(agent: CustomAgent, values: Record<string, number | string>) {
  const parts = agent.fields
    .map((field) => {
      const value = values?.[field.key];
      if (value === undefined || value === null || value === '') return null;
      return `${value}${field.unit ? ` ${field.unit}` : ''} ${field.label.toLowerCase()}`;
    })
    .filter(Boolean);

  return parts.length ? parts.join(' · ') : 'No stats recorded';
}

function EntryModal({
  agent,
  existing,
  open,
  onClose,
  onSaved
}: {
  agent: CustomAgent;
  existing: CustomEntry | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(existing?.values ?? {}).map(([key, value]) => [key, String(value)])
    )
  );
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(() =>
    (existing?.date ?? new Date().toISOString()).slice(0, 10)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Blank inputs are left out rather than saved as 0, so an untouched stat
      // does not drag the averages down.
      const filled: Record<string, number | string> = {};
      for (const field of agent.fields) {
        const raw = values[field.key];
        if (raw === undefined || raw.trim() === '') continue;
        filled[field.key] = field.type === 'number' ? Number(raw) : raw.trim();
      }

      const body = {
        title: title.trim(),
        values: filled,
        note: note.trim(),
        date: new Date(`${date}T12:00:00`).toISOString()
      };

      if (existing) await agentApi.updateEntry(existing._id, body);
      else await agentApi.createEntry(agent.slug, body);

      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Could not save this entry.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={existing ? `Edit ${agent.name.toLowerCase()} entry` : `Add ${agent.name.toLowerCase()} entry`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="entry-title">
            Title
          </label>
          <input
            id="entry-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Morning run"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {agent.fields.map((field: CustomAgentField) => (
            <div key={field.key}>
              <label className="label" htmlFor={`entry-${field.key}`}>
                {field.label}
                {field.unit && <span className="normal-case text-muted/70"> ({field.unit})</span>}
              </label>
              <input
                id={`entry-${field.key}`}
                className="input"
                type={field.type === 'number' ? 'number' : 'text'}
                step={field.type === 'number' ? 'any' : undefined}
                value={values[field.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div>
          <label className="label" htmlFor="entry-note">
            Note <span className="normal-case text-muted/70">(optional)</span>
          </label>
          <input
            id="entry-note"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="entry-date">
            Date
          </label>
          <input
            id="entry-date"
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? <Spinner /> : existing ? 'Save changes' : 'Save entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
