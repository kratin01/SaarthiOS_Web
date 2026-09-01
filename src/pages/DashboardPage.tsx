/**
 * The home screen. Defaults to today, because that is what you usually want to
 * know; the toggle switches the whole page to the month.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '@/api';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import { Page, PageHeader } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { EmptyState, ErrorState, Loading } from '@/components/ui/States';
import { LeafIcon, SparkIcon, WalletIcon } from '@/components/ui/Icons';
import { DonutChart, Legend, TrendChart } from '@/components/charts/Charts';
import { formatDay, formatMoney, formatRelativeDay, labelise } from '@/lib/format';
import type { DashboardPeriod } from '@/types';

const TONE_STYLES: Record<string, string> = {
  good: 'border-health/25 bg-health/5',
  neutral: 'border-line bg-canvas',
  warn: 'border-expense/25 bg-expense/5',
  alert: 'border-expense/40 bg-expense/10'
};

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'month', label: 'This month' }
];

export function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const { data, loading, error, reload } = useFetch(() => dashboardApi.overview(period), [period]);

  const toggle = (
    <div className="flex gap-1.5">
      {PERIODS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setPeriod(option.value)}
          className={`chip ${period === option.value ? 'chip-active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const header = (
    <PageHeader
      title={`${greeting()}, ${user?.name?.split(' ')[0] ?? 'there'}`}
      subtitle={period === 'today' ? 'Here is your day so far.' : 'Here is how your month is going.'}
      action={
        <div className="flex flex-wrap items-center gap-3">
          {toggle}
          <Link to="/chat" className="btn-primary">
            <SparkIcon className="h-4 w-4" />
            Ask Saarthi
          </Link>
        </div>
      }
    />
  );

  if (loading) {
    return (
      <Page>
        {header}
        <Loading label="Gathering your numbers" />
      </Page>
    );
  }
  if (error || !data) {
    return (
      <Page>
        {header}
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      </Page>
    );
  }

  const { currency, expenses, health, recent, insights, periodLabel, previousLabel } = data;
  const money = (value: number) => formatMoney(value, currency);
  const isMonth = data.period === 'month';

  const budgetProgress = expenses.budget ? (expenses.total / expenses.budget) * 100 : null;
  const calories = isMonth ? health.dailyAverage : health.totals.calories;
  const calorieProgress = health.calorieGoal ? (calories / health.calorieGoal) * 100 : null;

  return (
    <Page>
      {header}

      {insights.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, index) => (
            <p
              key={index}
              className={`rounded-xl border px-4 py-3 text-sm text-ink ${TONE_STYLES[insight.tone]}`}
            >
              {insight.text}
            </p>
          ))}
        </div>
      )}

      {/* Investments are a monthly habit, not a daily number — they live in their own tab. */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Stat
          label={`Spent ${periodLabel}`}
          value={money(expenses.total)}
          change={expenses.changePct}
          hint={expenses.budget ? `of ${money(expenses.budget)} budget` : `vs ${previousLabel}`}
          icon={<WalletIcon className="h-4 w-4" />}
          accent="#C08457"
          progress={budgetProgress}
        />
        <Stat
          label={isMonth ? 'Calories a day' : 'Calories today'}
          value={`${calories} kcal`}
          hint={
            isMonth
              ? `average over ${health.loggedDays} logged day${health.loggedDays === 1 ? '' : 's'}`
              : `${health.totals.meals} meal${health.totals.meals === 1 ? '' : 's'} · goal ${health.calorieGoal}`
          }
          icon={<LeafIcon className="h-4 w-4" />}
          accent="#6F9E7E"
          progress={calorieProgress}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card title="Spending" description={isMonth ? 'Each day this month' : 'Last 7 days'}>
          <TrendChart
            data={expenses.series}
            xKey="date"
            yKey="amount"
            color="#C08457"
            formatX={formatDay}
            formatY={(v) => formatMoney(v, currency, true)}
          />
        </Card>

        <Card title="Calories" description={isMonth ? 'Each day this month' : 'Last 7 days'}>
          <TrendChart
            data={health.series}
            xKey="date"
            yKey="calories"
            color="#6F9E7E"
            formatX={formatDay}
            formatY={(v) => `${v}`}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card
          title="Where money went"
          description={capitalise(periodLabel)}
          className="lg:col-span-2"
        >
          {expenses.byCategory.length ? (
            <div className="space-y-4">
              <DonutChart
                data={expenses.byCategory}
                nameKey="category"
                valueKey="amount"
                height={180}
                formatValue={money}
              />
              <Legend
                items={expenses.byCategory
                  .slice(0, 5)
                  .map((c) => ({ label: labelise(c.category), value: c.amount }))}
                formatValue={money}
              />
            </div>
          ) : (
            <EmptyState
              title={`Nothing spent ${periodLabel}`}
              description="Log an expense to see the split."
            />
          )}
        </Card>

        <Card
          title="Recent activity"
          description="Across every agent"
          className="lg:col-span-3"
          bodyClassName="p-0 sm:p-0"
        >
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: KIND_COLOR[item.kind] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                    <p className="truncate text-xs text-muted">{item.subtitle}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {item.amount !== null && (
                      <p className="text-sm font-medium text-ink">{money(item.amount)}</p>
                    )}
                    <p className="text-xs text-muted">{formatRelativeDay(item.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nothing here yet"
              description="Tell the assistant what you spent or ate and it will show up here."
              action={
                <Link to="/chat" className="btn-primary">
                  Start a conversation
                </Link>
              }
            />
          )}
        </Card>
      </div>
    </Page>
  );
}

const KIND_COLOR: Record<string, string> = {
  expense: '#C08457',
  meal: '#6F9E7E',
  investment: '#6B87A8'
};

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
