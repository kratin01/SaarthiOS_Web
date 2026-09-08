/**
 * Thin wrappers around Recharts so every chart in the app shares the same
 * muted styling, tooltip and empty state.
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { CHART_COLORS } from '@/lib/format';
import { useTheme } from '@/context/ThemeContext';

/**
 * Recharts styles through inline objects, so these cannot be Tailwind classes
 * and have to follow the theme by hand.
 */
function useChartTheme() {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return {
    axis: {
      stroke: dark ? '#818E86' : '#B9C0BA',
      fontSize: 11,
      tickLine: false,
      axisLine: false
    },
    tooltip: {
      borderRadius: 12,
      border: `1px solid ${dark ? '#2D3430' : '#E8EAE4'}`,
      backgroundColor: dark ? '#1E2320' : '#FFFFFF',
      color: dark ? '#E7EBE6' : '#2B322E',
      boxShadow: dark ? '0 8px 24px -12px rgba(0,0,0,.6)' : '0 8px 24px -12px rgba(43,50,46,.18)',
      fontSize: 12,
      padding: '8px 12px'
    },
    cursor: dark ? '#232A26' : '#F6F7F4'
  };
}

function NoData({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center text-sm text-muted">
      {label}
    </div>
  );
}

/** Trend over time — spending per day, calories per day. */
export function TrendChart({
  data,
  xKey,
  yKey,
  color = '#4E7C6B',
  height = 200,
  formatX,
  formatY
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  formatX?: (value: string) => string;
  formatY?: (value: number) => string;
}) {
  const chart = useChartTheme();
  if (!data.some((d) => Number(d[yKey]) > 0)) return <NoData label="Nothing logged in this period" />;

  const gradientId = `grad-${yKey}-${color.replace('#', '')}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey={xKey} {...chart.axis} tickFormatter={formatX} minTickGap={6} />
        <YAxis {...chart.axis} width={52} tickFormatter={formatY} />
        <Tooltip
          contentStyle={chart.tooltip}
          labelFormatter={(value) => (formatX ? formatX(String(value)) : String(value))}
          formatter={(value: number) => [formatY ? formatY(value) : value, '']}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Comparison across named buckets — categories, months, meal types. */
export function BarsChart({
  data,
  xKey,
  yKey,
  color = '#4E7C6B',
  height = 220,
  formatX,
  formatY
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  formatX?: (value: string) => string;
  formatY?: (value: number) => string;
}) {
  const chart = useChartTheme();
  if (!data.length) return <NoData label="Nothing to compare yet" />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
        {/* A handful of named buckets should all be labelled, but a month of
            daily bars cannot be: 30 labels overlap into an unreadable smear,
            so past a dozen Recharts is left to drop the ones that collide. */}
        <XAxis
          dataKey={xKey}
          {...chart.axis}
          tickFormatter={formatX}
          interval={data.length > 12 ? 'preserveStartEnd' : 0}
          minTickGap={8}
        />
        <YAxis {...chart.axis} width={52} tickFormatter={formatY} />
        <Tooltip
          cursor={{ fill: chart.cursor }}
          contentStyle={chart.tooltip}
          labelFormatter={(value) => (formatX ? formatX(String(value)) : String(value))}
          formatter={(value: number) => [formatY ? formatY(value) : value, '']}
        />
        <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Share of a whole — category split, portfolio allocation. */
export function DonutChart({
  data,
  nameKey,
  valueKey,
  height = 220,
  formatValue
}: {
  data: Record<string, string | number>[];
  nameKey: string;
  valueKey: string;
  height?: number;
  formatValue?: (value: number) => string;
}) {
  const chart = useChartTheme();
  if (!data.length) return <NoData label="Nothing to split yet" />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          innerRadius="58%"
          outerRadius="86%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={chart.tooltip}
          formatter={(value: number, name: string) => [
            formatValue ? formatValue(value) : value,
            name
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** The colour key that sits beside a donut. */
export function Legend({
  items,
  formatValue
}: {
  items: { label: string; value: number }[];
  formatValue: (value: number) => string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li key={item.label} className="flex items-center gap-3 text-sm">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
          />
          <span className="min-w-0 flex-1 truncate text-ink">{item.label}</span>
          <span className="shrink-0 text-muted">{Math.round((item.value / total) * 100)}%</span>
          <span className="w-20 shrink-0 text-right font-medium text-ink">
            {formatValue(item.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}
