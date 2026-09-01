/**
 * "Check prices" for holdings that have a share count.
 *
 * Prices are fetched only when asked for, never on page load — this is a live
 * call to an outside service and it should be a deliberate action.
 */
import { useState } from 'react';
import { investmentApi } from '@/api';
import { errorMessage } from '@/api/http';
import { useServiceNotice } from '@/context/StatusContext';
import { InlineNotice } from '@/components/ui/Notices';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/States';
import { TrendIcon } from '@/components/ui/Icons';
import { formatMoney } from '@/lib/format';
import type { HoldingsResponse, Range } from '@/types';

export function HoldingsPanel({
  range,
  currency,
  hasStocks
}: {
  range: Range;
  currency: string;
  hasStocks: boolean;
}) {
  const [data, setData] = useState<HoldingsResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serviceNotice = useServiceNotice('prices');

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      setData(await investmentApi.holdings(range));
    } catch (err) {
      setError(errorMessage(err, 'Could not fetch prices right now.'));
    } finally {
      setBusy(false);
    }
  };

  const totals = data?.totals;

  return (
    <Card
      title="How your shares are doing"
      description={
        hasStocks
          ? 'Live prices compared against what you paid.'
          : 'Add a stock purchase with a share count and this can price it.'
      }
      action={
        <button
          type="button"
          className="btn-ghost shrink-0"
          onClick={() => void load()}
          disabled={busy || !hasStocks || Boolean(serviceNotice)}
        >
          {busy ? <Spinner className="h-4 w-4" /> : <TrendIcon className="h-4 w-4" />}
          {busy ? 'Checking' : data ? 'Refresh prices' : 'Check prices'}
        </button>
      }
      className="mb-6"
    >
      {serviceNotice && (
        <div className="mb-3">
          <InlineNotice message={serviceNotice} />
        </div>
      )}
      {error && (
        <p className="rounded-xl border border-expense/25 bg-expense/5 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}

      {!data && !error && !serviceNotice && (
        <p className="text-sm text-muted">
          {hasStocks
            ? 'Prices are not fetched until you ask, so nothing here is stale without you knowing.'
            : 'Only holdings with a share count can be valued — a rupee amount alone does not say how many units it bought.'}
        </p>
      )}

      {data && !error && (
        <>
          {totals && totals.counted > 0 && (
            <div className="mb-4 grid gap-4 rounded-xl border border-line bg-canvas p-4 sm:grid-cols-4">
              <Figure label="Invested" value={formatMoney(totals.invested, currency)} />
              <Figure label="Worth now" value={formatMoney(totals.value, currency)} />
              <Figure
                label={totals.change >= 0 ? 'Profit' : 'Loss'}
                value={formatMoney(Math.abs(totals.change), currency)}
                tone={toneOf(totals.change)}
              />
              <Figure
                label="Change"
                value={`${totals.change >= 0 ? '+' : '−'}${Math.abs(totals.changePercent)}%`}
                tone={toneOf(totals.change)}
              />
            </div>
          )}

          {data.holdings.length === 0 ? (
            <p className="text-sm text-muted">No share purchases in this period.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.holdings.map((holding) => (
                <li key={holding._id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {holding.instrument || holding.symbol || 'Unnamed'}
                      {holding.symbol && (
                        <span className="ml-2 text-xs font-normal text-muted">{holding.symbol}</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {holding.quantity} × {formatMoney(holding.buyPrice, currency)} ={' '}
                      {formatMoney(holding.invested, currency)}
                    </p>
                  </div>

                  {holding.quote ? (
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-ink">
                        {formatMoney(holding.quote.value, holding.quote.currency || currency)}
                      </p>
                      <p className={`text-xs font-medium ${toneOf(holding.quote.change)}`}>
                        {holding.quote.change >= 0 ? '+' : '−'}
                        {formatMoney(
                          Math.abs(holding.quote.change),
                          holding.quote.currency || currency
                        )}{' '}
                        ({holding.quote.change >= 0 ? '+' : '−'}
                        {Math.abs(holding.quote.changePercent)}%)
                      </p>
                      <p className="text-xs text-muted">
                        now {formatMoney(holding.quote.price, holding.quote.currency || currency)}
                      </p>
                    </div>
                  ) : (
                    <p className="shrink-0 text-xs text-muted">
                      No price found{holding.symbol ? ` for ${holding.symbol}` : ' — add a ticker'}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-1 text-xs text-muted">
            {totals && totals.unpriced > 0 && (
              <p>
                {totals.unpriced} holding{totals.unpriced === 1 ? '' : 's'} could not be priced and
                {totals.unpriced === 1 ? ' is' : ' are'} left out of the totals.
              </p>
            )}
            {totals && totals.otherCurrency > 0 && (
              <p>
                {totals.otherCurrency} holding{totals.otherCurrency === 1 ? '' : 's'} trade in
                another currency, so {totals.otherCurrency === 1 ? 'it is' : 'they are'} shown above
                but not added to the {currency} total.
              </p>
            )}
            <p>
              Checked {new Date(data.checkedAt).toLocaleTimeString()}. Market prices are delayed and
              exclude brokerage, so treat this as an indication.
            </p>
          </div>
        </>
      )}
    </Card>
  );
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${tone ?? 'text-ink'}`}>{value}</p>
    </div>
  );
}

const toneOf = (change: number) => (change >= 0 ? 'text-health' : 'text-expense');
