/**
 * Operator view. Only visible to emails on the server's allowlist.
 *
 * There is deliberately nothing here that a user wrote: no chat, no expense or
 * meal rows. Signups and usage are what running the service needs.
 */
import { useId, useState, type ReactNode } from 'react';
import { adminApi } from '@/api';
import { useFetch } from '@/hooks/useFetch';
import { Page, PageHeader } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { Pager } from '@/components/ui/Pager';
import { ErrorState, Loading } from '@/components/ui/States';
import { ChatIcon, PlusIcon, SparkIcon, TrendIcon } from '@/components/ui/Icons';
import { BarsChart } from '@/components/charts/Charts';
import { AiProviderCard } from '@/components/settings/AiProviderCard';
import { formatDay, formatRelativeDay, plainPunctuation } from '@/lib/format';
import type { AdminOverview, AdminPerson, AdminSort } from '@/types';

const WARN = '#C08457';
const GOOD = '#6F9E7E';
const BLUE = '#6B87A8';

const RANGES = [7, 30, 90].map((days) => ({ value: days, label: `${days} days` }));
const SORTS: { value: AdminSort; label: string }[] = [
  { value: 'active', label: 'Recently active' },
  { value: 'joined', label: 'Newest' }
];

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString('en-IN')} ${n === 1 ? one : many}`;

/** "today" and "yesterday" read better in lower case mid-sentence. */
const relativeDay = (value: string) => {
  const text = formatRelativeDay(value);
  return text === 'Today' || text === 'Yesterday' ? text.toLowerCase() : text;
};

function loggedBreakdown(person: AdminPerson) {
  const parts: [number, string, string][] = [
    [person.expenses, 'expense', 'expenses'],
    [person.meals, 'meal', 'meals'],
    [person.investments, 'investment', 'investments'],
    [person.subscriptions, 'subscription', 'subscriptions'],
    [person.entries, 'custom agent entry', 'custom agent entries']
  ];
  const logged = parts.filter(([n]) => n > 0).map(([n, one, many]) => plural(n, one, many));
  return logged.length ? logged.join(', ') : 'Nothing logged yet';
}

export function AdminPage() {
  const [days, setDays] = useState(30);
  const [sort, setSort] = useState<AdminSort>('active');
  const [offset, setOffset] = useState(0);
  const { data, loading, error, reload } = useFetch(
    () => adminApi.overview(days, offset, sort),
    [days, offset, sort]
  );

  return (
    <Page>
      <PageHeader
        title="Admin"
        subtitle="How people use SaarthiOS. You see counts and dates, never anyone's chats or entries."
      />

      {loading && !data ? (
        <Loading label="Loading numbers" />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? null : (
        <>
          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm"
            >
              <span className="text-expense">Showing the last numbers that loaded. {error}</span>
              <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => void reload()}>
                Try again
              </button>
            </div>
          )}

          {/* Kept on screen while the next page loads. Swapping the whole page
              for a spinner on every click reads as a full reload. */}
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={loading}>
            <Activity
              data={data}
              days={days}
              onDays={(value) => {
                setDays(value);
                setOffset(0);
              }}
            />
            <People
              data={data}
              sort={sort}
              onSort={(value) => {
                setSort(value);
                setOffset(0);
              }}
              onPage={setOffset}
            />
            <Totals data={data} />
          </div>

          <Section
            title="AI for everyone"
            description="What every account uses until they add their own key in Settings."
          >
            <AiProviderCard
              api={adminApi.ai}
              title="Shared provider"
              description="Changes apply from the next message. No redeploy needed."
              savedMessage="Saved. Everyone on the default is now using this."
              resetLabel="Fall back to server config"
            />
          </Section>
        </>
      )}
    </Page>
  );
}

function Activity({ data, days, onDays }: { data: AdminOverview; days: number; onDays: (days: number) => void }) {
  const { users, ai, windowDays } = data;
  const activeShare = users.total ? Math.round((users.activeInWindow / users.total) * 100) : 0;
  const perDay = ai.runs / windowDays;

  return (
    <Section
      title="Activity"
      description={`The last ${windowDays} days. Active means they sent a message or logged something.`}
      action={<Choice label="Period" options={RANGES} value={days} onChange={onDays} />}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="New signups"
          value={users.newInWindow.toLocaleString('en-IN')}
          hint={`${plural(users.total, 'account')} in total`}
          icon={<PlusIcon className="h-4 w-4" />}
        />
        <Stat
          label="Active people"
          value={users.activeInWindow.toLocaleString('en-IN')}
          hint={`${activeShare}% of all accounts`}
          progress={activeShare}
          icon={<TrendIcon className="h-4 w-4" />}
        />
        <Stat
          label="Messages"
          value={ai.runs.toLocaleString('en-IN')}
          hint={ai.runs === 0 ? 'none yet' : perDay < 1 ? 'less than 1 a day' : `about ${Math.round(perDay)} a day`}
          accent={BLUE}
          icon={<ChatIcon className="h-4 w-4" />}
        />
        <Stat
          label="Failed AI replies"
          value={`${ai.failureRate}%`}
          hint={`${ai.failed.toLocaleString('en-IN')} of ${plural(ai.runs, 'message')}`}
          accent={ai.failureRate > 5 ? WARN : GOOD}
          icon={<SparkIcon className="h-4 w-4" />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Signups per day" description="New accounts created each day">
          <BarsChart
            data={data.signupsByDay}
            xKey="date"
            yKey="count"
            formatX={(value) => formatDay(String(value))}
          />
        </Card>
        <Card title="Messages per day" description="Messages sent to the assistant each day">
          <BarsChart
            data={data.messagesByDay}
            xKey="date"
            yKey="count"
            color={BLUE}
            formatX={(value) => formatDay(String(value))}
          />
        </Card>
      </div>

      <Card
        className="mt-4"
        title="Why AI replies failed"
        description="Most common first. Each line is the message the person saw."
      >
        {ai.recentFailures.length === 0 ? (
          <p className="text-sm text-muted">Nothing failed in the last {windowDays} days.</p>
        ) : (
          <ul className="divide-y divide-line">
            {ai.recentFailures.map((failure) => (
              <li key={failure.reason} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                {/* Stored as the person saw it, including text from before the no-dash rule. */}
                <p className="min-w-0 flex-1 text-sm text-ink">{plainPunctuation(failure.reason)}</p>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium tabular-nums text-ink">{plural(failure.count, 'time')}</p>
                  <p className="text-xs text-muted">last seen {relativeDay(failure.lastAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Section>
  );
}

function People({
  data,
  sort,
  onSort,
  onPage
}: {
  data: AdminOverview;
  sort: AdminSort;
  onSort: (sort: AdminSort) => void;
  onPage: (offset: number) => void;
}) {
  const { users, people, page } = data;

  return (
    <Section
      title="People"
      description={`${plural(users.total, 'account')}. ${
        users.neverUsed ? `${users.neverUsed} signed up and never used it.` : 'Everyone has used it at least once.'
      }`}
      action={<Choice label="Sort people" options={SORTS} value={sort} onChange={onSort} />}
    >
      <Card bodyClassName="p-0 sm:p-0">
        <ul className="divide-y divide-line md:hidden">
          {people.map((person) => (
            <li key={person.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{person.name}</p>
                  <p className="truncate text-xs text-muted">{person.email}</p>
                </div>
                <SignInBadge method={person.signedInWith} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <Detail label="Last active">
                  <LastActive value={person.lastActiveAt} />
                </Detail>
                <Detail label="Joined">{formatRelativeDay(person.joinedAt)}</Detail>
                <Detail label="Messages">{person.messages.toLocaleString('en-IN')}</Detail>
                <Detail label="Items logged" title={loggedBreakdown(person)}>
                  {person.records.toLocaleString('en-IN')}
                </Detail>
              </dl>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-5 py-3 font-medium">Person</th>
                <th scope="col" className="px-3 py-3 font-medium">Last active</th>
                <th scope="col" className="px-3 py-3 font-medium">Joined</th>
                <th scope="col" className="px-3 py-3 font-medium">Sign-in</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Messages</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Items logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {people.map((person) => (
                <tr key={person.id}>
                  <td className="px-5 py-3">
                    <p className="max-w-[18rem] truncate font-medium text-ink">{person.name}</p>
                    <p className="max-w-[18rem] truncate text-xs text-muted">{person.email}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <LastActive value={person.lastActiveAt} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-muted">{formatRelativeDay(person.joinedAt)}</td>
                  <td className="px-3 py-3">
                    <SignInBadge method={person.signedInWith} />
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink">
                    {person.messages.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-ink" title={loggedBreakdown(person)}>
                    {person.records.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pager offset={page.offset} limit={page.limit} total={page.total} onChange={onPage} noun="accounts" />
      </Card>
    </Section>
  );
}

function Totals({ data }: { data: AdminOverview }) {
  const { users, totals } = data;
  const items: [string, number][] = [
    ['Accounts', users.total],
    ['Messages', totals.messages],
    ['Expenses', totals.expenses],
    ['Meals', totals.meals],
    ['Investments', totals.investments],
    ['Subscriptions', totals.subscriptions],
    ['Custom agents', totals.agents],
    ['Custom agent entries', totals.entries]
  ];

  return (
    <Section title="All time" description="Everything since the start, across every account.">
      <dl className="card grid grid-cols-2 overflow-hidden sm:grid-cols-4">
        {items.map(([label, value]) => (
          // Borders, not a 1px gap (which can round to 2px); -1px margins hide the outer edges.
          <div key={label} className="-mb-px -mr-px border-b border-r border-line px-5 py-4">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums text-ink">
              {value.toLocaleString('en-IN')}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function Section({
  title,
  description,
  action,
  children
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="mt-10 first:mt-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="text-base font-semibold text-ink">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Choice<T extends string | number>({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          className={`chip ${option.value === value ? 'chip-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Detail({ label, title, children }: { label: string; title?: string; children: ReactNode }) {
  return (
    <div title={title}>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  );
}

function SignInBadge({ method }: { method: AdminPerson['signedInWith'] }) {
  return (
    <span className="inline-flex shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-muted">
      {method === 'google' ? 'Google' : 'Email'}
    </span>
  );
}

function LastActive({ value }: { value: string | null }) {
  return value ? (
    <span className="text-ink">{formatRelativeDay(value)}</span>
  ) : (
    <span className="text-expense">Never</span>
  );
}
