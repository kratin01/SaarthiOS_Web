/** Nutrition analytics plus a simple form for logging a meal by hand. */
import { useState } from 'react';
import { mealApi } from '@/api';
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
import { BodyProfileCard } from '@/components/health/BodyProfileCard';
import { TipsPanel } from '@/components/insights/TipsPanel';
import { LeafIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/ui/Icons';
import { BarsChart, DonutChart, Legend, TrendChart } from '@/components/charts/Charts';
import { formatDay, formatRelativeDay, labelise } from '@/lib/format';
import type { Meal, Range } from '@/types';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export function HealthPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>('week');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);

  const { data, loading, error, reload } = useFetch(() => mealApi.list(range), [range]);
  const goal = user?.dailyCalorieGoal ?? 2000;
  const proteinGoal = user?.dailyProteinGoal ?? 0;

  // Compared against a per-day goal, so it has to be a per-day number too.
  const proteinPerDay = data?.summary.loggedDays
    ? Math.round(data.summary.totals.protein / data.summary.loggedDays)
    : 0;

  const rows = useLoadMore({
    first: data?.items ?? [],
    firstPage: data?.page,
    resetKey: range,
    fetchMore: (offset) => mealApi.list(range, offset)
  });

  const remove = async (id: string) => {
    await mealApi.remove(id);
    void reload();
  };

  return (
    <Page>
      <PageHeader
        title="Health"
        subtitle="Meals and nutrition. All values are estimates, not medical measurements."
        action={
          <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
            <PlusIcon className="h-4 w-4" />
            Log meal
          </button>
        }
      />

      <BodyProfileCard />

      <div className="mb-6">
        <RangePicker value={range} onChange={setRange} />
      </div>

      <TipsPanel domain="health" range={range} accent="#6F9E7E" disabled={!data?.items.length} />

      {loading ? (
        <Loading label="Loading meals" />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Daily average"
              value={`${data.summary.dailyAverage} kcal`}
              hint={`goal ${goal} kcal`}
              icon={<LeafIcon className="h-4 w-4" />}
              accent="#6F9E7E"
              progress={goal ? (data.summary.dailyAverage / goal) * 100 : null}
            />
            <Stat
              label="Protein a day"
              value={`${proteinPerDay} g`}
              hint={
                proteinGoal
                  ? `goal ${proteinGoal} g a day`
                  : `${data.summary.totals.protein} g in total`
              }
              accent="#6F9E7E"
              progress={proteinGoal ? (proteinPerDay / proteinGoal) * 100 : null}
            />
            <Stat
              label="Meals logged"
              value={String(data.summary.mealCount)}
              hint={`over ${data.summary.loggedDays} day${data.summary.loggedDays === 1 ? '' : 's'}`}
              accent="#6F9E7E"
            />
            <Stat
              label="Most eaten"
              value={data.summary.topFoods[0]?.name ?? '—'}
              hint={data.summary.topFoods[0] ? `${data.summary.topFoods[0].count} times` : undefined}
              accent="#6F9E7E"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card title="Calories per day" className="lg:col-span-3">
              <TrendChart
                data={data.summary.byDay}
                xKey="date"
                yKey="calories"
                color="#6F9E7E"
                height={220}
                formatX={formatDay}
                formatY={(v) => `${v}`}
              />
            </Card>

            <Card title="Macro split" description="Grams across the period" className="lg:col-span-2">
              {data.summary.totals.calories > 0 ? (
                <div className="space-y-4">
                  <DonutChart
                    data={[
                      { name: 'Protein', value: data.summary.totals.protein },
                      { name: 'Carbs', value: data.summary.totals.carbs },
                      { name: 'Fat', value: data.summary.totals.fat }
                    ]}
                    nameKey="name"
                    valueKey="value"
                    height={170}
                    formatValue={(v) => `${v} g`}
                  />
                  <Legend
                    items={[
                      { label: 'Protein', value: data.summary.totals.protein },
                      { label: 'Carbs', value: data.summary.totals.carbs },
                      { label: 'Fat', value: data.summary.totals.fat }
                    ]}
                    formatValue={(v) => `${v} g`}
                  />
                </div>
              ) : (
                <EmptyState title="Nothing logged yet" />
              )}
            </Card>
          </div>

          {data.summary.byMealType.length > 0 && (
            <Card title="Calories by meal" className="mb-6">
              <BarsChart
                data={data.summary.byMealType.map((m) => ({
                  mealType: labelise(m.mealType),
                  calories: m.calories
                }))}
                xKey="mealType"
                yKey="calories"
                color="#6F9E7E"
              />
            </Card>
          )}

          <Card title="Meals" bodyClassName="p-0 sm:p-0">
            {rows.items.length ? (
              <>
                <ul className="divide-y divide-line">
                  {rows.items.map((meal) => (
                    <li key={meal._id} className="group flex items-start gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {labelise(meal.mealType)}
                          <span className="ml-2 text-xs font-normal text-muted">
                            {Math.round(meal.totals.calories)} kcal · {Math.round(meal.totals.protein)} g protein
                          </span>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {meal.items
                            .map((item) => (item.quantity ? `${item.name} (${item.quantity})` : item.name))
                            .join(', ')}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted">{formatRelativeDay(meal.date)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditing(meal)}
                        aria-label={`Edit ${meal.mealType}`}
                        className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-canvas hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(meal._id)}
                        aria-label="Delete meal"
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
                  noun="meals"
                />
              </>
            ) : (
              <EmptyState
                title="No meals in this period"
                description="Describe a meal in chat and the Health Agent estimates the nutrition for you."
              />
            )}
          </Card>
        </>
      )}

      <MealModal
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

interface DraftItem {
  name: string;
  quantity: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const BLANK_ITEM: DraftItem = {
  name: '',
  quantity: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: ''
};

function MealModal({
  existing,
  open,
  onClose,
  onSaved
}: {
  existing: Meal | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mealType, setMealType] = useState(existing?.mealType ?? 'lunch');
  const [items, setItems] = useState<DraftItem[]>(() =>
    existing?.items.length
      ? existing.items.map((item) => ({
          name: item.name,
          quantity: item.quantity ?? '',
          calories: String(item.calories),
          protein: String(item.protein),
          carbs: String(item.carbs),
          fat: String(item.fat)
        }))
      : [{ ...BLANK_ITEM }]
  );
  const [date, setDate] = useState(() =>
    (existing?.date ?? new Date().toISOString()).slice(0, 10)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setItem = (index: number, patch: Partial<DraftItem>) =>
    setItems((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const usable = items.filter((item) => item.name.trim() !== '');
    if (usable.length === 0) {
      setError('Add at least one food item.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const body = {
        mealType,
        items: usable.map((item) => ({
          name: item.name.trim(),
          quantity: item.quantity.trim(),
          calories: Number(item.calories) || 0,
          protein: Number(item.protein) || 0,
          carbs: Number(item.carbs) || 0,
          fat: Number(item.fat) || 0
        })),
        date: new Date(`${date}T12:00:00`).toISOString()
      };

      if (existing) await mealApi.update(existing._id, body);
      else await mealApi.create(body);

      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Could not save this meal.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={existing ? 'Edit meal' : 'Log a meal'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {!existing && (
          <p className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-muted">
            For several dishes at once, describe the meal in chat instead — the Health Agent
            estimates each item for you.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="mealType">
              Meal
            </label>
            <select
              id="mealType"
              className="input"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
            >
              {MEAL_TYPES.map((value) => (
                <option key={value} value={value}>
                  {labelise(value)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="meal-date">
              Date
            </label>
            <input
              id="meal-date"
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-xl border border-line p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Item {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setItems((list) => list.filter((_, i) => i !== index))}
                  disabled={items.length === 1}
                  aria-label={`Remove item ${index + 1}`}
                  className="rounded-lg p-1 text-muted transition hover:text-expense disabled:opacity-40"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Food</label>
                  <input
                    className="input"
                    value={item.name}
                    onChange={(e) => setItem(index, { name: e.target.value })}
                    placeholder="Dal"
                    autoFocus={index === 0}
                  />
                </div>
                <div>
                  <label className="label">Quantity</label>
                  <input
                    className="input"
                    value={item.quantity}
                    onChange={(e) => setItem(index, { quantity: e.target.value })}
                    placeholder="1 bowl"
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    ['Calories', 'calories'],
                    ['Protein g', 'protein'],
                    ['Carbs g', 'carbs'],
                    ['Fat g', 'fat']
                  ] as const
                ).map(([label, key]) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={item[key]}
                      onChange={(e) => setItem(index, { [key]: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="text-xs font-medium text-brand-700"
          onClick={() => setItems((list) => [...list, { ...BLANK_ITEM }])}
        >
          + Add another item
        </button>

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
