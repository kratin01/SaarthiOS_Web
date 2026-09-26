/** Shapes returned by the API. Kept in one file so pages stay readable. */

export interface User {
  _id: string;
  name: string;
  email: string;
  currency: string;
  monthlyBudget: number | null;
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  heightCm: number | null;
  weightKg: number | null;
  bodyGoal: BodyGoal;
  /** Categories this user invented, on top of the built-in list. */
  customCategories: string[];
  /** Worked out from the server's allowlist. Never stored on the account. */
  isAdmin?: boolean;
  googleId?: string | null;
  avatarUrl?: string;
}

export interface AdminPerson {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  signedInWith: 'google' | 'password';
  lastActiveAt: string | null;
  records: number;
  expenses: number;
  meals: number;
  investments: number;
  messages: number;
  agents: number;
}

export interface AdminOverview {
  generatedAt: string;
  windowDays: number;
  users: {
    total: number;
    newThisWeek: number;
    activeSevenDays: number;
    activeThirtyDays: number;
    neverUsed: number;
  };
  people: AdminPerson[];
  page: PageInfo;
  totals: { expenses: number; meals: number; investments: number; messages: number; agents: number };
  ai: {
    runs: number;
    failed: number;
    failureRate: number;
    recentFailures: { reason: string; count: number; lastAt: string }[];
  };
  signupsByDay: { date: string; count: number }[];
  messagesByDay: { date: string; count: number }[];
}

export type BodyGoal = 'lean' | 'normal' | 'bulky';

/** Worked out from height, weight and goal. Nothing is saved until you accept it. */
export interface BodyTargets {
  bmi: number;
  bmiBand: string;
  maintenanceCalories: number;
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  goalLabel: string;
  note: string;
}

export interface Tip {
  title: string;
  detail: string;
}

export interface TipsResponse {
  headline: string;
  tips: Tip[];
  range: string;
  domain: string;
}

export interface AuthProviders {
  google: { enabled: boolean; clientId: string };
}

export interface ServiceState {
  ok: boolean;
  /** Empty when there is nothing to say. Ready to show as-is. */
  notice: string;
}

/** What is working and what to tell people when it is not. */
export interface AppStatus {
  notice: string;
  services: {
    database: ServiceState;
    ai: ServiceState & { configured: boolean; provider: string; model: string };
    prices: ServiceState;
    import: ServiceState;
    google: { enabled: boolean };
  };
}

export interface Expense {
  _id: string;
  amount: number;
  category: string;
  merchant: string;
  note: string;
  date: string;
  source: 'manual' | 'chat';
}

export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  _id: string;
  mealType: string;
  items: FoodItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  note: string;
  date: string;
  source: 'manual' | 'chat';
}

export interface Investment {
  _id: string;
  amount: number;
  type: string;
  instrument: string;
  quantity: number | null;
  symbol: string;
  note: string;
  date: string;
  source: 'manual' | 'chat';
}

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * Recorded once; everything below `source` is worked out by the server from
 * `startedOn` and `cycle` rather than stored.
 */
export interface Subscription {
  _id: string;
  name: string;
  amount: number;
  cycle: BillingCycle;
  category: string;
  startedOn: string;
  endedOn: string | null;
  note: string;
  source: 'manual' | 'chat' | 'import';
  active: boolean;
  /** How many times it has charged since it started. */
  charges: number;
  paidToDate: number;
  monthly: number;
  yearly: number;
  nextChargeOn: string | null;
}

export interface SubscriptionSummary {
  monthly: number;
  yearly: number;
  daily: number;
  paidToDate: number;
  activeCount: number;
  cancelledCount: number;
  longestRunning: { _id: string; name: string; paidToDate: number; charges: number; since: string }[];
  byCategory: { category: string; monthly: number; count: number }[];
  upcoming: {
    _id: string;
    name: string;
    amount: number;
    cycle: BillingCycle;
    on: string;
    inDays: number;
  }[];
  dueThisMonth: number;
  /** Null until there is both a subscription and a month of spending to compare. */
  shareOfSpending: { spent: number; month: string; percent: number } | null;
}

/** One holding priced against the market right now. */
export interface Holding {
  _id: string;
  instrument: string;
  symbol: string;
  quantity: number;
  invested: number;
  buyPrice: number;
  date: string;
  quote: {
    price: number;
    currency: string;
    exchange: string;
    value: number;
    change: number;
    changePercent: number;
    at: string;
  } | null;
}

export interface HoldingsResponse {
  range: string;
  holdings: Holding[];
  totals: {
    currency: string;
    counted: number;
    unpriced: number;
    otherCurrency: number;
    invested: number;
    value: number;
    change: number;
    changePercent: number;
  };
  checkedAt: string;
}

export interface CustomAgentField {
  key: string;
  label: string;
  type: 'number' | 'text';
  unit: string;
}

/** An agent the user built in Settings. */
export interface CustomAgent {
  _id: string;
  name: string;
  slug: string;
  description: string;
  prompt: string;
  fields: CustomAgentField[];
  icon: string;
  active: boolean;
  /** How much history deleting this agent would take with it. */
  entryCount?: number;
}

export interface CustomEntry {
  _id: string;
  title: string;
  values: Record<string, number | string>;
  note: string;
  date: string;
  source: 'manual' | 'chat' | 'import';
}

export interface CustomAgentSummary {
  range: string;
  count: number;
  totals: { key: string; label: string; unit: string; total: number; average: number }[];
  byDay: ({ date: string; count: number } & Record<string, number>)[];
}

export interface AgentStep {
  agent: string;
  label: string;
  status: 'running' | 'done' | 'skipped' | 'failed';
  detail: string;
  at: string;
}

export interface AgentRun {
  _id: string;
  message: string;
  reply: string;
  intent: 'record' | 'query' | 'chat' | 'clarify';
  agentsUsed: string[];
  steps: AgentStep[];
  created: {
    expenses: number;
    meals: number;
    investments: number;
    subscriptions: number;
    custom: number;
  };
  status: 'completed' | 'failed';
  durationMs: number;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
}

export interface ExpenseSummary {
  range: string;
  total: number;
  count: number;
  byCategory: { category: string; amount: number; count: number }[];
  byDay: { date: string; amount: number }[];
  topMerchants: { merchant: string; amount: number; count: number }[];
}

export interface NutritionSummary {
  range: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  mealCount: number;
  loggedDays: number;
  dailyAverage: number;
  byDay: { date: string; calories: number; protein: number; carbs: number; fat: number }[];
  byMealType: { mealType: string; calories: number; count: number }[];
  topFoods: { name: string; count: number }[];
}

export interface InvestmentSummary {
  range: string;
  total: number;
  count: number;
  byType: { type: string; amount: number; count: number }[];
  byMonth: { month: string; amount: number }[];
  topInstruments: { instrument: string; amount: number }[];
}

export interface Insight {
  tone: 'good' | 'neutral' | 'warn' | 'alert';
  text: string;
}

export interface RecentItem {
  id: string;
  kind: 'expense' | 'meal' | 'investment' | 'custom';
  title: string;
  subtitle: string;
  amount: number | null;
  date: string;
}

export type DashboardPeriod = 'today' | 'month';

export interface Dashboard {
  currency: string;
  generatedAt: string;
  period: DashboardPeriod;
  /** "today" / "this month" — used verbatim in labels. */
  periodLabel: string;
  previousLabel: string;
  expenses: {
    total: number;
    previous: number;
    changePct: number;
    budget: number | null;
    byCategory: { category: string; amount: number }[];
    series: { date: string; amount: number }[];
  };
  health: {
    totals: { calories: number; protein: number; carbs: number; fat: number; meals: number };
    calorieGoal: number;
    loggedDays: number;
    dailyAverage: number;
    series: { date: string; calories: number; protein: number }[];
  };
  /** Investments are deliberately absent: they are a monthly habit, so the
   *  overview leaves them to the Investments page. */
  recent: RecentItem[];
  recentPage: PageInfo;
  insights: Insight[];
}

export interface AiStatus {
  configured: boolean;
  provider: string;
  label: string;
  model: string;
  /** `user` = saved in Settings, `shared` = the admin's default, `env` = from the server config. */
  source: 'user' | 'shared' | 'env';
  reason: string | null;
  keyHint: string;
  baseUrl: string;
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
  envFallbackAvailable: boolean;
  /** Only sent for the shared default. */
  updatedBy?: string;
  updatedAt?: string | null;
  usersOnDefault?: number;
}

export interface ProviderOption {
  id: string;
  label: string;
  defaultModel: string;
  defaultBaseUrl: string;
  keyOptional: boolean;
  keyHelp: string;
  suggested: { id: string; note: string }[];
}

export interface AiSettingsResponse extends AiStatus {
  providers: ProviderOption[];
}

export type PresetRange = 'today' | 'week' | 'month' | 'last_month' | 'year' | 'all';

/**
 * A preset window, or a single calendar month such as `2026-08`.
 * `string & {}` keeps the preset names in autocomplete while letting a month
 * key through — the server treats both the same way.
 */
export type Range = PresetRange | (string & {});

/** Returned by every list endpoint so the UI can say "showing 50 of 143". */
export interface PageInfo {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

/** Threads page backwards, so they report where the loaded window starts. */
export interface ThreadPageInfo {
  limit: number;
  total: number;
  oldestIndex: number;
  hasEarlier: boolean;
}

/* ---- Importing a bill or statement ---- */

export interface DraftExpense {
  amount: number;
  category: string;
  merchant: string;
  note: string;
  date: string;
}

export interface DraftMeal {
  mealType: string;
  items: FoodItem[];
  note: string;
  date: string;
}

export interface DraftInvestment {
  amount: number;
  type: string;
  instrument: string;
  note: string;
  date: string;
}

export interface ExtractedDocument {
  documentType: string;
  summary: string;
  expenses: DraftExpense[];
  meals: DraftMeal[];
  investments: DraftInvestment[];
}
