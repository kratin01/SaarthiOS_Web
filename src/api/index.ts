/**
 * Every backend call the app makes, grouped by feature.
 * Components import from here and never touch axios directly.
 */
import { http } from './http';
import type {
  AdminOverview,
  AgentRun,
  AiSettingsResponse,
  AiStatus,
  AppStatus,
  AuthProviders,
  BodyGoal,
  BodyTargets,
  Conversation,
  CustomAgent,
  CustomAgentSummary,
  CustomEntry,
  Dashboard,
  DashboardPeriod,
  DraftExpense,
  DraftInvestment,
  DraftMeal,
  Expense,
  ExpenseSummary,
  ExtractedDocument,
  HoldingsResponse,
  Investment,
  InvestmentSummary,
  Meal,
  NutritionSummary,
  PageInfo,
  Range,
  RecentItem,
  ThreadPageInfo,
  TipsResponse,
  User
} from '@/types';

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    http.post<{ token: string; user: User }>('/auth/register', body).then((r) => r.data),

  login: (body: { email: string; password: string }) =>
    http.post<{ token: string; user: User }>('/auth/login', body).then((r) => r.data),

  /** `credential` is the ID token from the Google button. */
  google: (credential: string) =>
    http.post<{ token: string; user: User }>('/auth/google', { credential }).then((r) => r.data),

  /** Which sign-in methods the server has switched on. No token needed. */
  providers: () => http.get<AuthProviders>('/auth/providers').then((r) => r.data),

  me: () => http.get<{ user: User }>('/auth/me').then((r) => r.data.user),

  updateProfile: (body: Partial<Pick<User, 'name' | 'currency' | 'monthlyBudget' | 'dailyCalorieGoal' | 'dailyProteinGoal' | 'heightCm' | 'weightKg' | 'bodyGoal'>>) =>
    http.patch<{ user: User }>('/auth/me', body).then((r) => r.data.user),

  /** Works out BMI and suggested targets. Saves nothing. */
  bodyTargets: (body: { heightCm: number; weightKg: number; bodyGoal: BodyGoal }) =>
    http.post<BodyTargets>('/auth/me/body-targets', body).then((r) => r.data)
};

export const chatApi = {
  /** Leave `conversationId` out to start a new thread. */
  send: (message: string, conversationId?: string) =>
    http
      .post<{ run: AgentRun; conversationId: string }>('/chat', { message, conversationId })
      .then((r) => r.data),

  conversations: (offset = 0) =>
    http
      .get<{ conversations: Conversation[]; page: PageInfo }>('/chat/conversations', {
        params: { offset }
      })
      .then((r) => r.data),

  /** Leave `before` out for the newest messages; pass `oldestIndex` to go back. */
  conversation: (id: string, before?: number) =>
    http
      .get<{ conversation: Conversation; runs: AgentRun[]; page: ThreadPageInfo }>(
        `/chat/conversations/${id}`,
        { params: before === undefined ? {} : { before } }
      )
      .then((r) => r.data),

  removeConversation: (id: string) =>
    http.delete(`/chat/conversations/${id}`).then(() => undefined),

  status: () => http.get<AiStatus>('/chat/status').then((r) => r.data)
};

/** The AI provider screen in Settings. Keys go up, never come back down. */
export const aiApi = {
  settings: () => http.get<AiSettingsResponse>('/ai/settings').then((r) => r.data),

  save: (body: { provider: string; model?: string; baseUrl?: string; apiKey?: string }) =>
    http.put<AiSettingsResponse>('/ai/settings', body).then((r) => r.data),

  reset: () => http.delete<AiSettingsResponse>('/ai/settings').then((r) => r.data),

  models: (body: { provider: string; model?: string; baseUrl?: string; apiKey?: string }) =>
    http.post<{ models: string[] }>('/ai/models', body).then((r) => r.data.models),

  test: (body: { provider: string; model?: string; baseUrl?: string; apiKey?: string }) =>
    http.post<{ ok: boolean; model: string; ms: number }>('/ai/test', body).then((r) => r.data),

  /** One AI pass over a screen's real numbers. `domain` may be a custom agent slug. */
  tips: (domain: string, range: Range = 'month') =>
    http.post<TipsResponse>('/ai/tips', { domain, range }, { timeout: 90_000 }).then((r) => r.data)
};

export const dashboardApi = {
  overview: (period: DashboardPeriod = 'today') =>
    http.get<Dashboard>('/dashboard', { params: { period } }).then((r) => r.data),
  activity: (offset: number, limit = 8) =>
    http
      .get<{ items: RecentItem[]; page: PageInfo }>('/dashboard/activity', {
        params: { offset, limit }
      })
      .then((r) => r.data)
};

export const adminApi = {
  overview: (days = 30) =>
    http.get<AdminOverview>('/admin/overview', { params: { days } }).then((r) => r.data)
};

export const expenseApi = {
  list: (range: Range = 'month', offset = 0) =>
    http
      .get<{ items: Expense[]; summary: ExpenseSummary; page: PageInfo }>('/expenses', {
        params: { range, offset }
      })
      .then((r) => r.data),

  create: (body: { amount: number; category: string; merchant?: string; note?: string; date?: string }) =>
    http.post<{ expense: Expense }>('/expenses', body).then((r) => r.data.expense),

  update: (
    id: string,
    body: Partial<{ amount: number; category: string; merchant: string; note: string; date: string }>
  ) => http.patch<{ expense: Expense }>(`/expenses/${id}`, body).then((r) => r.data.expense),

  remove: (id: string) => http.delete(`/expenses/${id}`).then(() => undefined)
};

export const mealApi = {
  list: (range: Range = 'week', offset = 0) =>
    http
      .get<{ items: Meal[]; summary: NutritionSummary; page: PageInfo }>('/meals', {
        params: { range, offset }
      })
      .then((r) => r.data),

  create: (body: {
    mealType: string;
    items: { name: string; quantity?: string; calories: number; protein: number; carbs: number; fat: number }[];
    note?: string;
    date?: string;
  }) => http.post<{ meal: Meal }>('/meals', body).then((r) => r.data.meal),

  update: (
    id: string,
    body: Partial<{
      mealType: string;
      items: { name: string; quantity?: string; calories: number; protein: number; carbs: number; fat: number }[];
      note: string;
      date: string;
    }>
  ) => http.patch<{ meal: Meal }>(`/meals/${id}`, body).then((r) => r.data.meal),

  remove: (id: string) => http.delete(`/meals/${id}`).then(() => undefined)
};

export const investmentApi = {
  list: (range: Range = 'year', offset = 0) =>
    http
      .get<{ items: Investment[]; summary: InvestmentSummary; page: PageInfo }>('/investments', {
        params: { range, offset }
      })
      .then((r) => r.data),

  create: (body: { amount: number; type: string; instrument?: string; quantity?: number | null; symbol?: string; note?: string; date?: string }) =>
    http.post<{ investment: Investment }>('/investments', body).then((r) => r.data.investment),

  update: (
    id: string,
    body: Partial<{ amount: number; type: string; instrument: string; quantity: number | null; symbol: string; note: string; date: string }>
  ) =>
    http.patch<{ investment: Investment }>(`/investments/${id}`, body).then((r) => r.data.investment),

  /** Live prices and profit/loss for holdings that have a unit count. */
  holdings: (range: Range = 'all') =>
    http
      .get<HoldingsResponse>('/investments/holdings', { params: { range }, timeout: 30_000 })
      .then((r) => r.data),

  remove: (id: string) => http.delete(`/investments/${id}`).then(() => undefined)
};

/** Agents the user built themselves. `max` is the server's configured limit. */
export const agentApi = {
  list: () =>
    http.get<{ agents: CustomAgent[]; max: number }>('/agents').then((r) => r.data),

  create: (body: {
    name: string;
    description?: string;
    prompt?: string;
    fields: { label: string; type: string; unit?: string }[];
    icon?: string;
  }) => http.post<{ agent: CustomAgent }>('/agents', body).then((r) => r.data.agent),

  update: (
    id: string,
    body: Partial<{
      name: string;
      description: string;
      prompt: string;
      fields: { label: string; type: string; unit?: string }[];
      icon: string;
      active: boolean;
    }>
  ) => http.patch<{ agent: CustomAgent }>(`/agents/${id}`, body).then((r) => r.data.agent),

  remove: (id: string) => http.delete(`/agents/${id}`).then(() => undefined),

  entries: (slug: string, range: Range = 'month', offset = 0) =>
    http
      .get<{
        agent: CustomAgent;
        items: CustomEntry[];
        summary: CustomAgentSummary;
        page: PageInfo;
      }>(`/agents/${slug}/entries`, { params: { range, offset } })
      .then((r) => r.data),

  createEntry: (
    slug: string,
    body: { title: string; values: Record<string, number | string>; note?: string; date?: string }
  ) => http.post<{ entry: CustomEntry }>(`/agents/${slug}/entries`, body).then((r) => r.data.entry),

  updateEntry: (
    id: string,
    body: Partial<{ title: string; values: Record<string, number | string>; note: string; date: string }>
  ) => http.patch<{ entry: CustomEntry }>(`/agents/entries/${id}`, body).then((r) => r.data.entry),

  removeEntry: (id: string) => http.delete(`/agents/entries/${id}`).then(() => undefined)
};

export const metaApi = {
  options: () =>
    http
      .get<{ expenseCategories: string[]; mealTypes: string[]; investmentTypes: string[] }>('/meta')
      .then((r) => r.data),

  /** What is working, and what to tell people when it is not. Needs no token. */
  status: () => http.get<AppStatus>('/status', { timeout: 8000 }).then((r) => r.data)
};

/** Reading a bill or statement. `extract` saves nothing; `confirm` does. */
export const importApi = {
  extract: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http
      .post<ExtractedDocument>('/import/extract', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // Reading a long statement takes a while.
        timeout: 120_000
      })
      .then((r) => r.data);
  },

  confirm: (body: {
    expenses: DraftExpense[];
    meals: DraftMeal[];
    investments: DraftInvestment[];
  }) =>
    http
      .post<{ created: { expenses: number; meals: number; investments: number } }>(
        '/import/confirm',
        body
      )
      .then((r) => r.data.created)
};
