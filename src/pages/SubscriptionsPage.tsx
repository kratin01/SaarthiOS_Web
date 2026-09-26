/**
 * Recurring services. Recorded once, then left alone — so the job of this page
 * is to make a number nobody chose to spend feel like one they did.
 */
import { useState } from 'react';
import { subscriptionApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { Page, PageHeader } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Loading, Spinner } from '@/components/ui/States';
import { TipsPanel } from '@/components/insights/TipsPanel';
import { PencilIcon, PlusIcon, RepeatIcon, TrashIcon } from '@/components/ui/Icons';
import { DonutChart, Legend } from '@/components/charts/Charts';
import { formatDay, formatMoney, labelise } from '@/lib/format';
import type { BillingCycle, Subscription } from '@/types';

const CATEGORIES = [
  'streaming',
  'music',
  'software',
  'gaming',
  'fitness',
  'news',
  'cloud',
  'education',
  'delivery',
  'utilities',
  'insurance',
  'other'
];

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'yearly', label: 'Every year' }
];

const ACCENT = '#A8829E';

const CYCLE_WORD: Record<BillingCycle, string> = {
  weekly: 'a week',
  monthly: 'a month',
  quarterly: 'a quarter',
  yearly: 'a year'
};

export function SubscriptionsPage() {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const { data, loading, error, reload } = useFetch(() => subscriptionApi.list(), []);
  const currency = user?.currency ?? 'INR';
  const money = (value: number) => formatMoney(value, currency);

  const remove = async (id: string) => {
    await subscriptionApi.remove(id);
    void reload();
  };

  const cancel = async (row: Subscription) => {
    await subscriptionApi.update(row._id, {
      endedOn: row.active ? new Date().toISOString() : null
    });
    void reload();
  };

  const summary = data?.summary;

  return (
    <Page>
      <PageHeader
        title="Subscriptions"
        subtitle="What renews on its own. Add it once and it keeps counting."
        action={
          <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
            <PlusIcon className="h-4 w-4" />
            Add subscription
          </button>
        }
      />

      <TipsPanel domain="subscription" range="all" accent={ACCENT} disabled={!summary?.activeCount} />

      {loading ? (
        <Loading label="Loading subscriptions" />
      ) : error || !data || !summary ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState
            title="Nothing renewing yet"
            description="Add Netflix, the gym, iCloud — anything that charges you on repeat. Or just tell the assistant."
            action={
              <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
                <PlusIcon className="h-4 w-4" />
                Add subscription
              </button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Every month"
              value={money(summary.monthly)}
              hint={`${summary.activeCount} active`}
              icon={<RepeatIcon className="h-4 w-4" />}
              accent={ACCENT}
            />
            <Stat
              label="Every year"
              value={money(summary.yearly)}
              hint={`${money(summary.daily)} a day`}
              accent={ACCENT}
            />
            <Stat
              label="Paid so far"
              value={money(summary.paidToDate)}
              hint="since each one started"
              accent={ACCENT}
            />
            <Stat
              label="Due in 30 days"
              value={money(summary.dueThisMonth)}
              hint={summary.upcoming[0] ? `next: ${summary.upcoming[0].name}` : undefined}
              accent={ACCENT}
            />
          </div>

          {summary.shareOfSpending && (
            <Card className="mb-6">
              <p className="text-sm text-ink">
                Subscriptions are{' '}
                <span className="font-semibold" style={{ color: ACCENT }}>
                  {summary.shareOfSpending.percent}%
                </span>{' '}
                of what you spent last month — {money(summary.monthly)} of{' '}
                {money(summary.shareOfSpending.spent)}, before you decided anything.
              </p>
            </Card>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card title="Renewing soon" className="lg:col-span-3" bodyClassName="p-0 sm:p-0">
              {summary.upcoming.length ? (
                <ul className="divide-y divide-line">
                  {summary.upcoming.map((row) => (
                    <li key={row._id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{row.name}</p>
                        <p className="text-xs text-muted">
                          {row.inDays === 0
                            ? 'today'
                            : row.inDays === 1
                              ? 'tomorrow'
                              : `in ${row.inDays} days`}{' '}
                          · {formatDay(row.on)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-medium text-ink">{money(row.amount)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-4">
                  <EmptyState title="Nothing due" />
                </div>
              )}
            </Card>

            <Card title="Where it goes" className="lg:col-span-2">
              {summary.byCategory.length ? (
                <div className="space-y-4">
                  <DonutChart
                    data={summary.byCategory}
                    nameKey="category"
                    valueKey="monthly"
                    height={170}
                    formatValue={money}
                  />
                  <Legend
                    items={summary.byCategory
                      .slice(0, 6)
                      .map((c) => ({ label: labelise(c.category), value: c.monthly }))}
                    formatValue={money}
                  />
                </div>
              ) : (
                <EmptyState title="Nothing active" />
              )}
            </Card>
          </div>

          {summary.longestRunning.length > 1 && (
            <Card
              title="Quietly adding up"
              description="What each one has taken since the day you started it"
              className="mb-6"
              bodyClassName="p-0 sm:p-0"
            >
              <ul className="divide-y divide-line">
                {summary.longestRunning.map((row) => (
                  <li key={row._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{row.name}</p>
                      <p className="text-xs text-muted">
                        {row.charges} charge{row.charges === 1 ? '' : 's'} since {formatDay(row.since)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-ink">{money(row.paidToDate)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card
            title="Everything you pay for"
            description={
              summary.cancelledCount
                ? `${summary.activeCount} active · ${summary.cancelledCount} cancelled`
                : undefined
            }
            bodyClassName="p-0 sm:p-0"
          >
            <ul className="divide-y divide-line">
              {data.items.map((row) => (
                <li key={row._id} className="group flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {row.name}
                      {!row.active && (
                        <span className="ml-2 rounded-full border border-line px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-muted">
                          cancelled
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {labelise(row.category)} · {money(row.amount)} {CYCLE_WORD[row.cycle]} ·{' '}
                      {money(row.paidToDate)} so far
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium text-ink">{money(row.monthly)}</p>
                    <p className="text-xs text-muted">a month</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void cancel(row)}
                    aria-label={row.active ? `Cancel ${row.name}` : `Restart ${row.name}`}
                    title={row.active ? 'Mark as cancelled' : 'Mark as active again'}
                    className="rounded-lg px-2 py-1 text-xs text-muted opacity-0 transition hover:bg-canvas hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    {row.active ? 'Cancel' : 'Restart'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(row)}
                    aria-label={`Edit ${row.name}`}
                    className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-canvas hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(row._id)}
                    aria-label={`Delete ${row.name}`}
                    className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-canvas hover:text-expense focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <SubscriptionModal
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

function SubscriptionModal({
  existing,
  open,
  onClose,
  onSaved
}: {
  existing: Subscription | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(existing?.name ?? '');
  const [amount, setAmount] = useState(existing?.amount?.toString() ?? '');
  const [cycle, setCycle] = useState<BillingCycle>(existing?.cycle ?? 'monthly');
  const [category, setCategory] = useState(existing?.category ?? 'streaming');
  const [startedOn, setStartedOn] = useState(
    (existing?.startedOn ?? new Date().toISOString()).slice(0, 10)
  );
  const [note, setNote] = useState(existing?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = Number(amount) || 0;
  const perMonth = value / { weekly: 52 / 12, monthly: 1, quarterly: 3, yearly: 12 }[cycle];

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        amount: value,
        cycle,
        category,
        note: note.trim(),
        startedOn: new Date(startedOn).toISOString()
      };
      if (existing) await subscriptionApi.update(existing._id, body);
      else await subscriptionApi.create(body);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Could not save that subscription.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={existing ? 'Edit subscription' : 'Add subscription'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label" htmlFor="sub-name">
            Name
          </label>
          <input
            id="sub-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Netflix, gym, iCloud…"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="sub-amount">
              Amount per charge
            </label>
            <input
              id="sub-amount"
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="sub-cycle">
              Charges
            </label>
            <select
              id="sub-cycle"
              className="input"
              value={cycle}
              onChange={(e) => setCycle(e.target.value as BillingCycle)}
            >
              {CYCLES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {value > 0 && cycle !== 'monthly' && (
          <p className="-mt-1 text-xs text-muted">
            That works out to {formatMoney(perMonth, user?.currency ?? 'INR')} a month.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="sub-category">
              Category
            </label>
            <select
              id="sub-category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {labelise(option)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="sub-started">
              Started on
            </label>
            <input
              id="sub-started"
              className="input"
              type="date"
              value={startedOn}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setStartedOn(e.target.value)}
            />
          </div>
        </div>
        <p className="-mt-1 text-xs text-muted">
          The start date is how "paid so far" is worked out, so get it roughly right.
        </p>

        <div>
          <label className="label" htmlFor="sub-note">
            Note <span className="normal-case text-muted/70">(optional)</span>
          </label>
          <input
            id="sub-note"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shared with family, work expense…"
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
          <button type="submit" className="btn-primary" disabled={busy || !name.trim() || !value}>
            {busy && <Spinner className="h-4 w-4" />}
            {existing ? 'Save changes' : 'Add subscription'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
