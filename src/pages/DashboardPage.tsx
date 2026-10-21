/**
 * The home screen. Defaults to today, because that is what you usually want to
 * know; the toggle switches the whole page to the month. Which cards show is
 * each person's choice (Customise), saved on their account.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '@/api';
import { useFetch } from '@/hooks/useFetch';
import { useLoadMore } from '@/hooks/useLoadMore';
import { useAuth } from '@/context/AuthContext';
import { Page, PageHeader } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { LoadMore } from '@/components/ui/LoadMore';
import { EmptyState, ErrorState, Loading } from '@/components/ui/States';
import {
  DumbbellIcon,
  LeafIcon,
  RepeatIcon,
  SettingsIcon,
  SparkIcon,
  TrendIcon,
  WalletIcon,
  agentIcon
} from '@/components/ui/Icons';
import { DonutChart, Legend, TrendChart } from '@/components/charts/Charts';
import { InspirationCard } from '@/components/overview/InspirationCard';
import { InsightsCard } from '@/components/overview/InsightsCard';
import { CustomiseOverview } from '@/components/overview/CustomiseOverview';
import { DEFAULT_OVERVIEW_CARDS, agentCardId } from '@/lib/overview';
import { formatDay, formatMoney, formatRelativeDay, labelise } from '@/lib/format';
import type { Dashboard, DashboardPeriod } from '@/types';

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'month', label: 'This month' }
];

/** Tailwind needs whole class names, so the stat grid columns are looked up by count. */
const STAT_COLUMNS = [
  '',
  '',
  'sm:grid-cols-2',
  'sm:grid-cols-2 lg:grid-cols-3',
  'sm:grid-cols-2 xl:grid-cols-4'
];

export function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const [customising, setCustomising] = useState(false);
  const { data, loading, error, reload } = useFetch(() => dashboardApi.overview(period), [period]);

  const chosen = new Set(user?.overviewCards ?? DEFAULT_OVERVIEW_CARDS);
  const show = (id: string) => chosen.has(id);
  const showInspiration = show('inspiration');
  const showInsights = show('insights');

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
          <button type="button" className="btn-ghost" onClick={() => setCustomising(true)}>
            <SettingsIcon className="h-4 w-4" />
            Customise
          </button>
          <Link to="/chat" className="btn-primary">
            <SparkIcon className="h-4 w-4" />
            Ask Saarthi
          </Link>
        </div>
      }
    />
  );

  let body: ReactNode;
  if (loading) {
    body = <Loading label="Gathering your numbers" />;
  } else if (error || !data) {
    body = <ErrorState message={error ?? 'No data'} onRetry={reload} />;
  } else {
    body = (
      <OverviewCards
        data={data}
        show={show}
        aiShown={showInspiration || showInsights}
        onCustomise={() => setCustomising(true)}
      />
    );
  }

  return (
    <Page>
      {header}

      {/* Outside the loading branch, so the AI blocks never wait for the numbers. */}
      {showInspiration && <InspirationCard className="mb-6" />}
      {showInsights && <InsightsCard period={period} />}

      {body}

      {customising && <CustomiseOverview onClose={() => setCustomising(false)} />}
    </Page>
  );
}

interface OverviewCardsProps {
  data: Dashboard;
  show: (id: string) => boolean;
  /** Inspiration or insights is on, so no other card does not mean an empty page. */
  aiShown: boolean;
  onCustomise: () => void;
}

function OverviewCards({ data, show, aiShown, onCustomise }: OverviewCardsProps) {
  const activity = useLoadMore({
    first: data.recent,
    firstPage: data.recentPage,
    resetKey: 'activity',
    fetchMore: (offset) => dashboardApi.activity(offset)
  });

  const { currency, expenses, health, investments, subscriptions, agents, recent } = data;
  const { periodLabel, previousLabel } = data;
  const money = (value: number) => formatMoney(value, currency);
  const isMonth = data.period === 'month';

  const budgetProgress = expenses.budget ? (expenses.total / expenses.budget) * 100 : null;
  const calories = isMonth ? health.dailyAverage : health.totals.calories;
  const calorieProgress = health.calorieGoal ? (calories / health.calorieGoal) * 100 : null;
  const protein = isMonth ? health.dailyProteinAverage : health.totals.protein;
  const proteinProgress = health.proteinGoal ? (protein / health.proteinGoal) * 100 : null;
  const averageOver = `average over ${health.loggedDays} logged day${health.loggedDays === 1 ? '' : 's'}`;

  const stats: ReactNode[] = [];
  if (show('spent')) {
    stats.push(
      <Stat
        key="spent"
        label={`Spent ${periodLabel}`}
        value={money(expenses.total)}
        change={expenses.changePct}
        hint={expenses.budget ? `of ${money(expenses.budget)} budget` : `vs ${previousLabel}`}
        icon={<WalletIcon className="h-4 w-4" />}
        accent="#C08457"
        progress={budgetProgress}
      />
    );
  }
  if (show('calories')) {
    stats.push(
      <Stat
        key="calories"
        label={isMonth ? 'Calories a day' : 'Calories today'}
        value={`${calories} kcal`}
        hint={
          isMonth
            ? averageOver
            : `${health.totals.meals} meal${health.totals.meals === 1 ? '' : 's'} · goal ${health.calorieGoal}`
        }
        icon={<LeafIcon className="h-4 w-4" />}
        accent="#6F9E7E"
        progress={calorieProgress}
      />
    );
  }
  if (show('protein')) {
    const goal = health.proteinGoal ? `goal ${health.proteinGoal} g` : 'set a goal on Health';
    stats.push(
      <Stat
        key="protein"
        label={isMonth ? 'Protein a day' : 'Protein today'}
        value={`${protein} g`}
        hint={isMonth ? `${averageOver} · ${goal}` : capitalise(goal)}
        icon={<DumbbellIcon className="h-4 w-4" />}
        accent="#6F9E7E"
        progress={proteinProgress}
      />
    );
  }
  if (show('investments')) {
    stats.push(
      <Stat
        key="investments"
        label="Invested this month"
        value={money(investments.total)}
        hint={
          investments.count
            ? `${investments.count} contribution${investments.count === 1 ? '' : 's'}`
            : 'Nothing invested yet this month'
        }
        icon={<TrendIcon className="h-4 w-4" />}
        accent="#6B87A8"
      />
    );
  }
  if (show('subscriptions')) {
    const next = subscriptions.next;
    stats.push(
      <Stat
        key="subscriptions"
        label="Subscriptions a month"
        value={money(subscriptions.monthly)}
        hint={
          next
            ? `Next: ${next.name} ${dueIn(next.inDays)}`
            : subscriptions.activeCount
              ? `${subscriptions.activeCount} active`
              : 'None tracked yet'
        }
        icon={<RepeatIcon className="h-4 w-4" />}
        accent="#A8829E"
      />
    );
  }
  for (const agent of agents) {
    if (!show(agentCardId(agent.id))) continue;
    const Icon = agentIcon(agent.icon);
    const entries = `${agent.count} entr${agent.count === 1 ? 'y' : 'ies'}`;
    stats.push(
      <Stat
        key={agent.id}
        label={`${agent.name} ${periodLabel}`}
        value={
          agent.stat
            ? `${agent.stat.total.toLocaleString('en-IN')}${agent.stat.unit ? ` ${agent.stat.unit}` : ''}`
            : entries
        }
        hint={agent.stat ? `${agent.stat.label} · ${entries}` : `logged ${periodLabel}`}
        icon={<Icon className="h-4 w-4" />}
        accent="#8E7CC3"
      />
    );
  }

  const showSpending = show('spending_trend');
  const showCalories = show('calories_trend');
  const showCategories = show('categories');
  const showActivity = show('activity');

  if (!stats.length && !showSpending && !showCalories && !showCategories && !showActivity) {
    return aiShown ? null : (
      <EmptyState
        title="Your Overview is empty"
        description="Choose the cards you want to see here."
        action={
          <button type="button" className="btn-primary" onClick={onCustomise}>
            Customise
          </button>
        }
      />
    );
  }

  return (
    <>
      {stats.length > 0 && (
        <div
          className={`mb-6 grid grid-cols-1 gap-4 ${STAT_COLUMNS[stats.length] ?? 'sm:grid-cols-2 lg:grid-cols-3'}`}
        >
          {stats}
        </div>
      )}

      {(showSpending || showCalories) && (
        <div
          className={`mb-6 grid grid-cols-1 gap-4 ${showSpending && showCalories ? 'lg:grid-cols-2' : ''}`}
        >
          {showSpending && (
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
          )}

          {showCalories && (
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
          )}
        </div>
      )}

      {(showCategories || showActivity) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {showCategories && (
            <Card
              title="Where money went"
              description={capitalise(periodLabel)}
              className={showActivity ? 'lg:col-span-2' : 'lg:col-span-5'}
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
          )}

          {showActivity && (
            <Card
              title="Recent activity"
              description="Across every agent"
              className={showCategories ? 'lg:col-span-3' : 'lg:col-span-5'}
              bodyClassName="p-0 sm:p-0"
            >
              {recent.length ? (
                <>
                  {/* Capped so loading more scrolls inside the card instead of
                      stretching the page past the chart beside it. */}
                  <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto">
                    {activity.items.map((item) => (
                      <li
                        key={`${item.kind}-${item.id}`}
                        className="flex items-center gap-3 px-5 py-3"
                      >
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

                  <LoadMore
                    shown={activity.shown}
                    total={activity.total}
                    hasMore={activity.hasMore}
                    loading={activity.loadingMore}
                    error={activity.moreError}
                    onMore={() => void activity.loadMore()}
                    noun="entries"
                  />
                </>
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
          )}
        </div>
      )}
    </>
  );
}

const dueIn = (days: number) =>
  days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;

const KIND_COLOR: Record<string, string> = {
  expense: '#C08457',
  meal: '#6F9E7E',
  investment: '#6B87A8',
  custom: '#8A7CA8'
};

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
