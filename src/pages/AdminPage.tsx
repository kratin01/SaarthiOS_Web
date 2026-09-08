/**
 * Operator view. Only visible to emails on the server's allowlist.
 *
 * There is deliberately nothing here that a user wrote: no chat, no expense or
 * meal rows. Signups and usage are what running the service needs.
 */
import { useState } from 'react';
import { adminApi } from '@/api';
import { useFetch } from '@/hooks/useFetch';
import { Page, PageHeader } from '@/components/layout/Page';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { ErrorState, Loading } from '@/components/ui/States';
import { BarsChart } from '@/components/charts/Charts';
import { formatDay, formatRelativeDay } from '@/lib/format';

export function AdminPage() {
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useFetch(() => adminApi.overview(days), [days]);

  return (
    <Page>
      <PageHeader
        title="Admin"
        subtitle="Signups and usage across the whole app. No one's chat or entries."
        action={
          <div className="flex flex-wrap gap-1.5">
            {[7, 30, 90].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDays(option)}
                className={`chip ${days === option ? 'chip-active' : ''}`}
              >
                {option} days
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <Loading label="Loading numbers" />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="People" value={String(data.users.total)} hint={`${data.users.newThisWeek} joined this week`} />
            <Stat
              label="Active this week"
              value={String(data.users.activeSevenDays)}
              hint={`${data.users.activeThirtyDays} in 30 days`}
              progress={data.users.total ? (data.users.activeSevenDays / data.users.total) * 100 : null}
            />
            <Stat
              label="Never used it"
              value={String(data.users.neverUsed)}
              hint="signed up, logged nothing"
              accent="#C08457"
            />
            <Stat
              label="AI failures"
              value={`${data.ai.failureRate}%`}
              hint={`${data.ai.failed} of ${data.ai.runs} messages`}
              accent={data.ai.failureRate > 5 ? '#C08457' : '#6F9E7E'}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Signups" description={`Last ${data.windowDays} days`}>
              <BarsChart
                data={data.signupsByDay}
                xKey="date"
                yKey="count"
                formatX={(value) => formatDay(String(value))}
              />
            </Card>
            <Card title="Messages" description={`Last ${data.windowDays} days`}>
              <BarsChart
                data={data.messagesByDay}
                xKey="date"
                yKey="count"
                color="#6B87A8"
                formatX={(value) => formatDay(String(value))}
              />
            </Card>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Messages" value={String(data.totals.messages)} />
            <Stat label="Expenses" value={String(data.totals.expenses)} accent="#C08457" />
            <Stat label="Meals" value={String(data.totals.meals)} accent="#6F9E7E" />
            <Stat label="Investments" value={String(data.totals.investments)} accent="#6B87A8" />
            <Stat label="Custom agents" value={String(data.totals.agents)} />
          </div>

          {data.ai.recentFailures.length > 0 && (
            <Card title="What is failing" description={`Last ${data.windowDays} days`} className="mb-6">
              <ul className="space-y-2">
                {data.ai.recentFailures.map((failure) => (
                  <li key={failure.reason} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 text-ink">{failure.reason}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {failure.count}× · {formatRelativeDay(failure.lastAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="People" description={`${data.people.length} accounts, newest first`} bodyClassName="p-0 sm:p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Person</th>
                    <th className="px-3 py-3 font-medium">Joined</th>
                    <th className="px-3 py-3 font-medium">Last active</th>
                    <th className="px-3 py-3 text-right font-medium">Messages</th>
                    <th className="px-5 py-3 text-right font-medium">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.people.map((person) => (
                    <tr key={person.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{person.name}</p>
                        <p className="truncate text-xs text-muted">
                          {person.email} · {person.signedInWith}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">{formatRelativeDay(person.joinedAt)}</td>
                      <td className="px-3 py-3 text-xs text-muted">
                        {person.lastActiveAt ? formatRelativeDay(person.lastActiveAt) : 'never'}
                      </td>
                      <td className="px-3 py-3 text-right text-ink">{person.messages}</td>
                      <td className="px-5 py-3 text-right text-ink">{person.records}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </Page>
  );
}
