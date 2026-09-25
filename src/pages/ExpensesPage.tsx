/** Expense analytics plus a small form for adding one by hand. */
import { useState } from 'react';
import { expenseApi, authApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useFetch } from '@/hooks/useFetch';
import { useLoadMore } from '@/hooks/useLoadMore';
import { useAuth } from '@/context/AuthContext';
import { Page, PageHeader } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { Modal } from '@/components/ui/Modal';
import { RangePicker } from '@/components/ui/RangePicker';
import { ReportButton } from '@/components/ui/ReportButton';
import { EmptyState, ErrorState, Loading, Spinner } from '@/components/ui/States';
import { LoadMore } from '@/components/ui/LoadMore';
import { ImportModal } from '@/components/import/ImportModal';
import { TipsPanel } from '@/components/insights/TipsPanel';
import { PencilIcon, PlusIcon, TrashIcon, UploadIcon, WalletIcon } from '@/components/ui/Icons';
import { BarsChart, DonutChart, Legend, TrendChart } from '@/components/charts/Charts';
import { formatDay, formatMoney, formatRelativeDay, labelise } from '@/lib/format';
import type { Expense, Range } from '@/types';

const CATEGORIES = [
  'food',
  'groceries',
  'transport',
  'shopping',
  'bills',
  'entertainment',
  'health',
  'travel',
  'education',
  'other'
];

/** Sentinel for the "name your own" option, which is never a real category. */
const NEW_CATEGORY = '__new__';

export function ExpensesPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>('month');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [importing, setImporting] = useState(false);

  const { data, loading, error, reload } = useFetch(() => expenseApi.list(range), [range]);
  const currency = user?.currency ?? 'INR';
  const money = (value: number) => formatMoney(value, currency);

  const rows = useLoadMore({
    first: data?.items ?? [],
    firstPage: data?.page,
    resetKey: range,
    fetchMore: (offset) => expenseApi.list(range, offset)
  });

  const remove = async (id: string) => {
    await expenseApi.remove(id);
    void reload();
  };

  return (
    <Page>
      <PageHeader
        title="Expenses"
        subtitle="Everything going out, grouped and compared."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={() => setImporting(true)}>
              <UploadIcon className="h-4 w-4" />
              Import
            </button>
            <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
              <PlusIcon className="h-4 w-4" />
              Add expense
            </button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <RangePicker value={range} onChange={setRange} />
        <ReportButton download={expenseApi.report} range={range} empty={!data?.items.length} />
      </div>

      <TipsPanel domain="expense" range={range} accent="#C08457" disabled={!data?.items.length} />

      {loading ? (
        <Loading label="Loading expenses" />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : data.summary.count === 0 ? (
        <Card>
          <EmptyState
            title={`Nothing recorded for ${data.summary.range}`}
            description="Pick a different period above, or add what you spent in it."
            action={
              <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
                <PlusIcon className="h-4 w-4" />
                Add expense
              </button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              label={`Total ${data.summary.range}`}
              value={money(data.summary.total)}
              hint={`${data.summary.count} transaction${data.summary.count === 1 ? '' : 's'}`}
              icon={<WalletIcon className="h-4 w-4" />}
              accent="#C08457"
            />
            <Stat
              label="Average per transaction"
              value={money(data.summary.count ? data.summary.total / data.summary.count : 0)}
              accent="#C08457"
            />
            <Stat
              label="Top category"
              value={data.summary.byCategory[0] ? labelise(data.summary.byCategory[0].category) : '—'}
              hint={data.summary.byCategory[0] ? money(data.summary.byCategory[0].amount) : undefined}
              accent="#C08457"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card title="Daily spending" className="lg:col-span-3">
              <TrendChart
                data={data.summary.byDay}
                xKey="date"
                yKey="amount"
                color="#C08457"
                height={220}
                formatX={formatDay}
                formatY={(v) => formatMoney(v, currency, true)}
              />
            </Card>

            <Card title="By category" className="lg:col-span-2">
              {data.summary.byCategory.length ? (
                <div className="space-y-4">
                  <DonutChart
                    data={data.summary.byCategory}
                    nameKey="category"
                    valueKey="amount"
                    height={170}
                    formatValue={money}
                  />
                  <Legend
                    items={data.summary.byCategory
                      .slice(0, 6)
                      .map((c) => ({ label: labelise(c.category), value: c.amount }))}
                    formatValue={money}
                  />
                </div>
              ) : (
                <EmptyState title="No categories yet" />
              )}
            </Card>
          </div>

          {data.summary.topMerchants.length > 0 && (
            <Card title="Where you spend most" className="mb-6">
              <BarsChart
                data={data.summary.topMerchants.map((m) => ({
                  merchant: m.merchant,
                  amount: m.amount
                }))}
                xKey="merchant"
                yKey="amount"
                color="#C08457"
                formatY={(v) => formatMoney(v, currency, true)}
              />
            </Card>
          )}

          <Card title="Transactions" bodyClassName="p-0 sm:p-0">
            {rows.items.length ? (
              <>
                <ul className="divide-y divide-line">
                  {rows.items.map((item) => (
                    <li key={item._id} className="group flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {item.merchant || labelise(item.category)}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {labelise(item.category)}
                          {item.note && ` · ${item.note}`}
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
                        aria-label={`Edit ${item.merchant || item.category}`}
                        className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-canvas hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(item._id)}
                        aria-label="Delete expense"
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
                  noun="transactions"
                />
              </>
            ) : (
              <EmptyState
                title="No expenses in this period"
                description="Add one by hand, or just tell the assistant what you spent."
              />
            )}
          </Card>
        </>
      )}

      <ExpenseModal
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

      <ImportModal
        open={importing}
        currency={currency}
        onClose={() => setImporting(false)}
        onImported={reload}
      />
    </Page>
  );
}

function ExpenseModal({
  existing,
  open,
  onClose,
  onSaved
}: {
  existing: Expense | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user, setUser } = useAuth();
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [category, setCategory] = useState(existing?.category ?? 'food');
  const [newCategory, setNewCategory] = useState('');
  const [merchant, setMerchant] = useState(existing?.merchant ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(() =>
    (existing?.date ?? new Date().toISOString()).slice(0, 10)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The row being edited is included in case its category was invented on a
  // device whose user record this page has not refreshed yet.
  const options = [
    ...new Set([...CATEGORIES, ...(user?.customCategories ?? []), ...(existing ? [existing.category] : [])])
  ];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const named = newCategory.trim();
      const body = {
        amount: Number(amount),
        category: category === NEW_CATEGORY ? named : category,
        merchant: merchant.trim(),
        note: note.trim(),
        date: new Date(`${date}T12:00:00`).toISOString()
      };

      if (existing) await expenseApi.update(existing._id, body);
      else await expenseApi.create(body);

      // A new name is registered server-side, so the local user is now stale
      // and the dropdown would not offer it next time.
      if (category === NEW_CATEGORY) {
        const me = await authApi.me();
        setUser(me);
      }

      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Could not save this expense.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={existing ? 'Edit expense' : 'Add expense'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="amount">
            Amount
          </label>
          <input
            id="amount"
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
          <label className="label" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {options.map((value) => (
              <option key={value} value={value}>
                {labelise(value)}
              </option>
            ))}
            <option value={NEW_CATEGORY}>Something else...</option>
          </select>

          {category === NEW_CATEGORY && (
            <div className="mt-2">
              <input
                className="input"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Name it, e.g. rent, rahul, side project"
                maxLength={24}
                required
                autoFocus
              />
              <p className="mt-1.5 text-xs text-muted">
                This becomes one of your categories, and the assistant will use it too.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="label" htmlFor="merchant">
            Merchant <span className="normal-case text-muted/70">(optional)</span>
          </label>
          <input
            id="merchant"
            className="input"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="Rapido, Swiggy, …"
          />
        </div>

        <div>
          <label className="label" htmlFor="note">
            Note <span className="normal-case text-muted/70">(optional)</span>
          </label>
          <input
            id="note"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was it for?"
          />
        </div>

        <div>
          <label className="label" htmlFor="date">
            Date
          </label>
          <input
            id="date"
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
