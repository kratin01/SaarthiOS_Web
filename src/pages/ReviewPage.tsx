/**
 * Month in review: one month told through the user's own records, with a short
 * write-up from the insight agent on top. The numbers arrive first; the story
 * is an AI call, so it fills in when it is ready and never holds the page up.
 */
import { useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { reviewApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useFetch } from '@/hooks/useFetch';
import { Page, PageHeader } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { EmptyState, ErrorState, Loading } from '@/components/ui/States';
import {
  CalendarIcon,
  ChatIcon,
  CheckIcon,
  CopyIcon,
  DumbbellIcon,
  HeartIcon,
  LeafIcon,
  RepeatIcon,
  SparkIcon,
  TargetIcon,
  TrendIcon,
  WalletIcon,
  agentIcon
} from '@/components/ui/Icons';
import {
  CHART_COLORS,
  formatDay,
  formatMoney,
  isMonthRange,
  labelise,
  monthRangeLabel,
  plainPunctuation
} from '@/lib/format';
import { defaultReviewMonth } from '@/lib/review';
import type { MonthReview, ReviewStory } from '@/types';

const ACCENT = {
  expense: '#C08457',
  health: '#6F9E7E',
  invest: '#6B87A8',
  subscription: '#A8829E',
  brand: '#4E7C6B',
  custom: '#8E7CC3'
};

export function ReviewPage() {
  const [params, setParams] = useSearchParams();
  const asked = params.get('month') ?? '';
  const month = isMonthRange(asked) ? asked : defaultReviewMonth();

  const review = useFetch(() => reviewApi.month(month), [month]);
  const storyFetch = useFetch(() => reviewApi.story(month), [month]);
  const [rewritten, setRewritten] = useState<{ month: string; story: ReviewStory } | null>(null);
  const [rewriting, setRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'yes' | 'failed' | null>(null);

  const story = rewritten?.month === month ? rewritten.story : storyFetch.data;
  const data = review.data;
  const money = (value: number) => formatMoney(value, data?.currency ?? 'INR');

  const rewrite = async () => {
    setRewriting(true);
    setRewriteError(null);
    try {
      setRewritten({ month, story: await reviewApi.refreshStory(month) });
    } catch (err) {
      setRewriteError(errorMessage(err, 'Could not write it again right now.'));
    } finally {
      setRewriting(false);
    }
  };

  const copy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(recapText(data, story ?? null, money));
      setCopied('yes');
    } catch {
      setCopied('failed');
    }
  };

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const header = (
    <PageHeader
      title="Month in review"
      subtitle="Your month, told by your own numbers."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker value={month} onChange={(next) => setParams({ month: next })} />
          <button
            type="button"
            className="btn-ghost"
            onClick={() => void copy()}
            disabled={!data || isEmpty(data)}
          >
            {copied === 'yes' ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
            {copied === 'yes' ? 'Copied' : copied === 'failed' ? 'Could not copy' : 'Copy recap'}
          </button>
        </div>
      }
    />
  );

  if (review.loading) {
    return (
      <Page>
        {header}
        <Loading label="Adding up your month" />
      </Page>
    );
  }
  if (review.error || !data) {
    return (
      <Page>
        {header}
        <ErrorState message={review.error ?? 'No data'} onRetry={review.reload} />
      </Page>
    );
  }
  if (isEmpty(data)) {
    return (
      <Page>
        {header}
        <Card>
          <EmptyState
            title={`Nothing logged in ${data.label} yet`}
            description="Tell the assistant what you spend and eat, and this page writes itself."
            action={
              <Link to="/chat" className="btn-primary">
                Open the assistant
              </Link>
            }
          />
        </Card>
      </Page>
    );
  }

  const { food, investing } = data;
  const m = data.money;
  const shortMonth = monthRangeLabel(month).split(' ')[0];

  return (
    <Page>
      {header}

      <section className="card relative mb-6 overflow-hidden px-6 py-7 sm:px-8 sm:py-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-expense/10 blur-3xl"
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              {data.label}
              {data.isCurrent ? ', so far' : ''}
            </p>
            {story && (
              <button
                type="button"
                onClick={() => void rewrite()}
                disabled={rewriting}
                className="btn-quiet -mr-2 -mt-2 p-2"
                aria-label="Write it again"
                title="Write it again"
              >
                <RepeatIcon className={`h-4 w-4 ${rewriting ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {storyFetch.loading && !story ? (
            <div className="mt-4" role="status">
              <span className="sr-only">Your insight agent is writing up your month</span>
              <div className="h-9 w-72 max-w-full animate-pulse rounded-lg bg-line" />
              <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-line" />
              <div className="mt-2 h-4 w-2/3 max-w-md animate-pulse rounded bg-line" />
            </div>
          ) : story ? (
            <div className={`animate-fade-up ${rewriting ? 'opacity-60' : ''}`}>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {plainPunctuation(story.persona)}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/80">
                {plainPunctuation(story.headline)}
              </p>
              {story.notice && (
                <p className="mt-3 flex max-w-2xl items-start gap-2 text-xs text-muted">
                  <SparkIcon className="mt-px h-3.5 w-3.5 shrink-0" />
                  {story.notice}
                </p>
              )}
            </div>
          ) : (
            <>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Your {shortMonth} in numbers
              </h2>
              {storyFetch.error && (
                <p className="mt-3 max-w-2xl text-sm text-muted">{storyFetch.error}</p>
              )}
            </>
          )}
          {rewriteError && <p className="mt-3 text-sm text-expense">{rewriteError}</p>}
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigNumber
          label={data.isCurrent ? 'Spent so far' : 'Spent'}
          value={m.total}
          format={money}
          hint={changeHint(m)}
          icon={<WalletIcon className="h-4 w-4" />}
          accent={ACCENT.expense}
        />
        <BigNumber
          label="No-spend days"
          value={m.noSpendDays}
          hint={`out of ${plural(data.daysCovered, 'day')}`}
          icon={<CheckIcon className="h-4 w-4" />}
          accent={ACCENT.health}
        />
        <BigNumber
          label="Meals logged"
          value={food.meals}
          hint={food.daysLogged ? `across ${plural(food.daysLogged, 'day')}` : 'Tell the assistant what you eat'}
          icon={<LeafIcon className="h-4 w-4" />}
          accent={ACCENT.health}
        />
        <BigNumber
          label="Invested"
          value={investing.total}
          format={money}
          hint={investing.count ? plural(investing.count, 'contribution') : 'Nothing invested this month'}
          icon={<TrendIcon className="h-4 w-4" />}
          accent={ACCENT.invest}
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink">Moments</h2>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {moments(data, money).map(({ key, icon: Icon, ...moment }) => (
          <Moment key={key} icon={<Icon className="h-5 w-5" />} {...moment} />
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card
          title="Where it went"
          description={`${money(m.total)} across ${plural(m.transactions, 'transaction')}`}
          className="lg:col-span-3"
        >
          {m.categories.length ? (
            <ul className="space-y-3">
              {m.categories.map((row, index) => (
                <li key={row.category}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-ink">{labelise(row.category)}</span>
                    <span className="shrink-0 text-muted">
                      {row.share}% <span className="ml-2 font-medium text-ink">{money(row.amount)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${Math.max(row.share, 2)}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No spending this month" />
          )}
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {story && story.highlights.length > 0 && (
            <Card title="What stood out">
              <ol className="space-y-3">
                {story.highlights.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{plainPunctuation(item.title)}</p>
                      <p className="mt-0.5 text-sm text-muted">{plainPunctuation(item.text)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}
          {story?.nudge && (
            <section className="card border-brand-200 bg-brand-50 px-5 py-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-brand-700">
                <TargetIcon className="h-4 w-4" />
                For next month
              </p>
              <p className="mt-2 text-sm text-ink">{plainPunctuation(story.nudge)}</p>
            </section>
          )}
          {!story && (
            <Card title="What stood out">
              <p className="flex items-start gap-2 text-sm text-muted">
                <SparkIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {storyFetch.loading
                  ? 'Your insight agent is reading the month.'
                  : 'The written highlights appear here when an AI provider is set up.'}
              </p>
            </Card>
          )}
        </div>
      </div>

      {data.agents.length > 0 && (
        <Card title="Your agents" className="mb-6">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.agents.map((agent) => {
              const Icon = agentIcon(agent.icon);
              return (
                <li
                  key={agent.name}
                  className="flex items-center gap-3 rounded-xl border border-line px-4 py-3"
                >
                  <span
                    className="rounded-lg p-1.5"
                    style={{ backgroundColor: `${ACCENT.custom}1A`, color: ACCENT.custom }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{agent.name}</p>
                    <p className="truncate text-xs text-muted">
                      {plural(agent.entries, 'entry', 'entries')}
                      {agent.stat && ` · ${statText(agent.stat)}`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <p className="text-center text-xs text-muted">
        Every number comes from what you logged. Nutrition figures are estimates.
      </p>
    </Page>
  );
}

const isEmpty = (data: MonthReview) =>
  !data.money.transactions && !data.food.meals && !data.investing.count;

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString('en-IN')} ${count === 1 ? one : many}`;

/** Noon, so a `YYYY-MM-DD` key never slips to the day before in western timezones. */
const day = (key: string) => new Date(`${key}T12:00:00`);

function changeHint(m: MonthReview['money']) {
  if (m.changePct === null) return plural(m.transactions, 'transaction');
  const direction = m.changePct > 0 ? 'Up' : m.changePct < 0 ? 'Down' : 'Level';
  const when = m.previous.partial ? ' at this point' : '';
  return `${direction} ${Math.abs(m.changePct)}% on ${m.previous.label}${when}`;
}

const statText = (stat: { label: string; unit: string; total: number }) =>
  `${stat.total.toLocaleString('en-IN')}${stat.unit ? ` ${stat.unit}` : ''} ${stat.label.toLowerCase()}`;

interface MomentData {
  key: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  label: string;
  value: string;
  detail: string;
}

/** Only the moments worth celebrating that the month actually has; an empty one is never shown. */
function moments(data: MonthReview, money: (value: number) => string): MomentData[] {
  const { money: m, food, subscriptions, assistant } = data;
  const list: (MomentData | false)[] = [
    !!m.biggest && {
      key: 'biggest',
      icon: WalletIcon,
      accent: ACCENT.expense,
      label: 'Biggest purchase',
      value: money(m.biggest.amount),
      detail: [
        m.biggest.label,
        m.biggest.merchant && m.biggest.merchant !== m.biggest.label ? ` at ${m.biggest.merchant}` : '',
        `, ${formatDay(day(m.biggest.date))}`
      ].join('')
    },
    !!m.longestNoSpend && {
      key: 'streak',
      icon: CheckIcon,
      accent: ACCENT.health,
      label: 'Longest no-spend streak',
      value: plural(m.longestNoSpend.days, 'day'),
      detail: `${formatDay(day(m.longestNoSpend.from))} to ${formatDay(day(m.longestNoSpend.to))}`
    },
    !!m.busiestDay && {
      key: 'busiest',
      icon: CalendarIcon,
      accent: ACCENT.expense,
      label: 'Busiest day',
      value: money(m.busiestDay.amount),
      detail: day(m.busiestDay.date).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      })
    },
    !!m.regular && {
      key: 'regular',
      icon: RepeatIcon,
      accent: ACCENT.subscription,
      label: 'Your regular',
      value: m.regular.merchant,
      detail: `${plural(m.regular.count, 'visit')}, ${money(m.regular.amount)}`
    },
    !!food.favourite && {
      key: 'food',
      icon: LeafIcon,
      accent: ACCENT.health,
      label: 'Favourite food',
      value: food.favourite.name,
      detail: `logged ${plural(food.favourite.count, 'time')}`
    },
    !!food.proteinGoal && food.proteinGoalDays > 0 && {
      key: 'protein',
      icon: DumbbellIcon,
      accent: ACCENT.health,
      label: 'Protein goal hit',
      value: plural(food.proteinGoalDays, 'day'),
      detail: `of ${plural(food.daysLogged, 'logged day')}, about ${food.avgProtein} g a day`
    },
    !!food.calorieGoal && food.onTargetDays > 0 && {
      key: 'calories',
      icon: HeartIcon,
      accent: ACCENT.health,
      label: 'Calories on target',
      value: plural(food.onTargetDays, 'day'),
      detail: `within 10% of ${food.calorieGoal} kcal, about ${food.avgCalories} kcal a day`
    },
    m.weekendShare !== null && m.transactions >= 3 && {
      key: 'weekend',
      icon: CalendarIcon,
      accent: ACCENT.invest,
      label: 'Weekend share',
      value: `${m.weekendShare}%`,
      detail: 'of your spending landed on Saturdays and Sundays'
    },
    !!(m.budget && m.budgetUsedPct !== null) && {
      key: 'budget',
      icon: TargetIcon,
      accent: ACCENT.expense,
      label: 'Budget used',
      value: `${m.budgetUsedPct}%`,
      detail: `of your ${money(m.budget ?? 0)} monthly budget`
    },
    subscriptions.active > 0 && {
      key: 'subscriptions',
      icon: RepeatIcon,
      accent: ACCENT.subscription,
      label: 'Subscriptions',
      value: `${money(subscriptions.monthly)} a month`,
      detail: `${plural(subscriptions.active, 'service')} running`
    },
    assistant.messages > 0 && {
      key: 'assistant',
      icon: ChatIcon,
      accent: ACCENT.brand,
      label: 'Chats with Saarthi',
      value: plural(assistant.messages, 'message'),
      detail: m.viaChatShare !== null
        ? `${m.viaChatShare}% of expenses were logged by chat`
        : 'all in plain words'
    }
  ];
  return list.filter((item): item is MomentData => Boolean(item));
}

function BigNumber({
  label,
  value,
  format = (n) => n.toLocaleString('en-IN'),
  hint,
  icon,
  accent
}: {
  label: string;
  value: number;
  format?: (value: number) => string;
  hint: string;
  icon: ReactNode;
  accent: string;
}) {
  const shown = useCountUp(value);
  return (
    <div className="card px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <span className="rounded-lg p-1.5" style={{ backgroundColor: `${accent}1A`, color: accent }}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-ink sm:text-3xl">
        {format(Math.round(shown))}
      </p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function Moment({
  icon,
  accent,
  label,
  value,
  detail
}: {
  icon: ReactNode;
  accent: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="card flex gap-4 px-5 py-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 truncate text-lg font-semibold text-ink">{value}</p>
        <p className="text-sm text-muted">{detail}</p>
      </div>
    </div>
  );
}

/** Counts up to `target` once, unless the person asked for less motion. */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(() => (prefersStill() ? target : 0));
  const from = useRef(0);

  useEffect(() => {
    if (prefersStill()) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const next = origin + (target - origin) * (1 - (1 - progress) ** 3);
      from.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

const prefersStill = () =>
  typeof window.matchMedia !== 'function' ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Plain text for pasting into a chat or a note. */
function recapText(data: MonthReview, story: ReviewStory | null, money: (value: number) => string) {
  const m = data.money;
  return [
    `My ${data.label}${data.isCurrent ? ' so far' : ''} on SaarthiOS${story ? `: ${story.persona}` : ''}`,
    story?.headline ?? '',
    `Spent ${money(m.total)} across ${plural(m.transactions, 'transaction')}.`,
    m.longestNoSpend ? `Longest no-spend streak: ${plural(m.longestNoSpend.days, 'day')}.` : '',
    m.biggest ? `Biggest purchase: ${m.biggest.label}, ${money(m.biggest.amount)}.` : '',
    data.food.meals
      ? `Logged ${plural(data.food.meals, 'meal')} on ${plural(data.food.daysLogged, 'day')}.`
      : '',
    data.investing.total ? `Invested ${money(data.investing.total)}.` : '',
    story?.nudge ? `Next month: ${story.nudge}` : ''
  ]
    .filter(Boolean)
    .map(plainPunctuation)
    .join('\n');
}
