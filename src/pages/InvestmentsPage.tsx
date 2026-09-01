/** Investment analytics plus a form for recording a contribution by hand. */
import { useState } from 'react';
import { investmentApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useFetch } from '@/hooks/useFetch';
import { useLoadMore } from '@/hooks/useLoadMore';
import { useAuth } from '@/context/AuthContext';
import { Page, PageHeader } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { Modal } from '@/components/ui/Modal';
import { RangePicker } from '@/components/ui/RangePicker';
import { EmptyState, ErrorState, Loading, Spinner } from '@/components/ui/States';
import { LoadMore } from '@/components/ui/LoadMore';
import { TipsPanel } from '@/components/insights/TipsPanel';
import { HoldingsPanel } from '@/components/investments/HoldingsPanel';
import { PencilIcon, PlusIcon, TrashIcon, TrendIcon } from '@/components/ui/Icons';
import { BarsChart, DonutChart, Legend } from '@/components/charts/Charts';
import { formatMoney, formatMonth, formatRelativeDay, labelise } from '@/lib/format';
import type { Investment, Range } from '@/types';

const TYPES = [
  'sip',
  'mutual_fund',
  'liquid_fund',
  'stocks',
  'gold',
  'fixed_deposit',
  'ppf',
  'crypto',
  'other'
];

/** Matches QUANTITY_TYPES on the server. */
const QUANTITY_TYPES = ['stocks'];

export function InvestmentsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>('year');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);

  const { data, loading, error, reload } = useFetch(() => investmentApi.list(range), [range]);
  const currency = user?.currency ?? 'INR';
  const money = (value: number) => formatMoney(value, currency);

  const rows = useLoadMore({
    first: data?.items ?? [],
    firstPage: data?.page,
    resetKey: range,
    fetchMore: (offset) => investmentApi.list(range, offset)
  });

  const remove = async (id: string) => {
    await investmentApi.remove(id);
    void reload();
  };

  const monthCount = data?.summary.byMonth.length ?? 0;

  return (
    <Page>
      <PageHeader
        title="Investments"
        subtitle="Contributions you have recorded. These are amounts invested, not live market value."
        action={
          <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
            <PlusIcon className="h-4 w-4" />
            Add investment
          </button>
        }
      />

      <div className="mb-6">
        <RangePicker
          value={range}
          onChange={setRange}
          options={[
            { value: 'month', label: 'Month' },
            { value: 'last_month', label: 'Last month' },
            { value: 'year', label: 'Year' },
            { value: 'all', label: 'All time' }
          ]}
        />
      </div>

      <TipsPanel domain="investment" range={range} accent="#6B87A8" disabled={!data?.items.length} />

      <HoldingsPanel
        range={range}
        currency={currency}
        hasStocks={Boolean(data?.items.some((i) => i.quantity && QUANTITY_TYPES.includes(i.type)))}
      />

      {loading ? (
        <Loading label="Loading investments" />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              label={`Contributed ${data.summary.range}`}
              value={money(data.summary.total)}
              hint={`${data.summary.count} contribution${data.summary.count === 1 ? '' : 's'}`}
              icon={<TrendIcon className="h-4 w-4" />}
              accent="#6B87A8"
            />
            <Stat
              label="Monthly average"
              value={money(monthCount ? data.summary.total / monthCount : 0)}
              hint={`across ${monthCount} month${monthCount === 1 ? '' : 's'}`}
              accent="#6B87A8"
            />
            <Stat
              label="Largest allocation"
              value={data.summary.byType[0] ? labelise(data.summary.byType[0].type) : '—'}
              hint={data.summary.byType[0] ? money(data.summary.byType[0].amount) : undefined}
              accent="#6B87A8"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card title="Contributions by month" className="lg:col-span-3">
              <BarsChart
                data={data.summary.byMonth.map((m) => ({ month: m.month, amount: m.amount }))}
                xKey="month"
                yKey="amount"
                color="#6B87A8"
                height={220}
                formatX={formatMonth}
                formatY={(v) => formatMoney(v, currency, true)}
              />
            </Card>

            <Card title="Allocation" className="lg:col-span-2">
              {data.summary.byType.length ? (
                <div className="space-y-4">
                  <DonutChart
                    data={data.summary.byType}
                    nameKey="type"
                    valueKey="amount"
                    height={170}
                    formatValue={money}
                  />
                  <Legend
                    items={data.summary.byType
                      .slice(0, 6)
                      .map((t) => ({ label: labelise(t.type), value: t.amount }))}
                    formatValue={money}
                  />
                </div>
              ) : (
                <EmptyState title="No allocation yet" />
              )}
            </Card>
          </div>

          <Card title="Contributions" bodyClassName="p-0 sm:p-0">
            {rows.items.length ? (
              <>
                <ul className="divide-y divide-line">
                  {rows.items.map((item) => (
                    <li key={item._id} className="group flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {item.instrument || labelise(item.type)}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {labelise(item.type)}
                          {item.quantity ? ` · ${item.quantity} × ${money(item.amount / item.quantity)}` : ''}
                          {item.source === 'chat' && ' · via chat'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-ink">{money(item.amount)}</p>
                        <p className="text-xs text-muted">{formatRelativeDay(item.date)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        aria-label={`Edit ${item.instrument || item.type}`}
                        className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-canvas hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(item._id)}
                        aria-label="Delete investment"
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
                  noun="contributions"
                />
              </>
            ) : (
              <EmptyState
                title="No investments in this period"
                description='Try telling the assistant: "Invested ₹10,000 through SIP this month".'
              />
            )}
          </Card>
        </>
      )}

      <InvestmentModal
        key={editing?._id ?? 'new'}
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
    </Page>
  );
}

function InvestmentModal({
  existing,
  open,
  onClose,
  onSaved
}: {
  existing: Investment | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [type, setType] = useState(existing?.type ?? 'sip');
  const [instrument, setInstrument] = useState(existing?.instrument ?? '');
  const [quantity, setQuantity] = useState(existing?.quantity ? String(existing.quantity) : '');
  const [symbol, setSymbol] = useState(existing?.symbol ?? '');
  const [date, setDate] = useState(() =>
    (existing?.date ?? new Date().toISOString()).slice(0, 10)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsQuantity = QUANTITY_TYPES.includes(type);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = {
        amount: Number(amount),
        type,
        instrument: instrument.trim(),
        // Cleared when switching away from a type that counts units, so a
        // leftover number cannot make a SIP look like 12 shares.
        quantity: needsQuantity && quantity !== '' ? Number(quantity) : null,
        symbol: needsQuantity ? symbol.trim().toUpperCase() : '',
        date: new Date(`${date}T12:00:00`).toISOString()
      };

      if (existing) await investmentApi.update(existing._id, body);
      else await investmentApi.create(body);

      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Could not save this investment.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={existing ? 'Edit investment' : 'Add investment'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="inv-amount">
            Amount
          </label>
          <input
            id="inv-amount"
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="label" htmlFor="inv-type">
            Type
          </label>
          <select id="inv-type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((value) => (
              <option key={value} value={value}>
                {labelise(value)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="instrument">
            {needsQuantity ? 'Company' : 'Fund or instrument'}{' '}
            {!needsQuantity && <span className="normal-case text-muted/70">(optional)</span>}
          </label>
          <input
            id="instrument"
            className="input"
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            placeholder={needsQuantity ? 'Reliance Industries' : 'Parag Parikh Flexi Cap'}
            required={needsQuantity}
          />
        </div>

        {needsQuantity && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="inv-quantity">
                Shares
              </label>
              <input
                id="inv-quantity"
                className="input"
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
                required
              />
              {quantity && Number(quantity) > 0 && Number(amount) > 0 && (
                <p className="mt-1.5 text-xs text-muted">
                  {formatMoney(Number(amount) / Number(quantity), 'INR')} per share
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="inv-symbol">
                Ticker <span className="normal-case text-muted/70">(optional)</span>
              </label>
              <input
                id="inv-symbol"
                className="input"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="RELIANCE.NS"
              />
              <p className="mt-1.5 text-xs text-muted">
                Leave blank and it is looked up from the company name.
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="label" htmlFor="inv-date">
            Date
          </label>
          <input
            id="inv-date"
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

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
