/**
 * What the Overview can show. Mirrors `OVERVIEW_CARDS` and `INSPIRATION_KINDS`
 * in the API's `config/constants.js`; each custom agent adds `agent:<id>`.
 */
import type { InspirationKind } from '@/types';

export interface OverviewCardOption {
  id: string;
  label: string;
  description: string;
}

export const OVERVIEW_CARD_GROUPS: { title: string; cards: OverviewCardOption[] }[] = [
  {
    title: 'For you',
    cards: [
      { id: 'inspiration', label: 'Daily inspiration', description: 'An affirmation, quote or thought, new every day' },
      { id: 'insights', label: 'AI insights', description: 'What your insight agent noticed in your numbers' }
    ]
  },
  {
    title: 'Numbers',
    cards: [
      { id: 'spent', label: 'Spent', description: 'Spending for the period, with your budget' },
      { id: 'calories', label: 'Calories', description: 'Calories against your daily goal' },
      { id: 'protein', label: 'Protein', description: 'Protein against your daily goal' },
      { id: 'investments', label: 'Invested this month', description: 'Money put into investments this month' },
      { id: 'subscriptions', label: 'Subscriptions', description: 'Monthly cost and the next renewal' }
    ]
  },
  {
    title: 'Charts and lists',
    cards: [
      { id: 'spending_trend', label: 'Spending trend', description: 'Spending day by day' },
      { id: 'calories_trend', label: 'Calories trend', description: 'Calories day by day' },
      { id: 'categories', label: 'Where money went', description: 'Spending split by category' },
      { id: 'activity', label: 'Recent activity', description: 'Latest entries across every agent' }
    ]
  }
];

/** What a new or untouched account sees. */
export const DEFAULT_OVERVIEW_CARDS = [
  'inspiration',
  'insights',
  'spent',
  'calories',
  'spending_trend',
  'calories_trend',
  'categories',
  'activity'
];

export const agentCardId = (agentId: string) => `agent:${agentId}`;

export const INSPIRATION_KINDS: { value: InspirationKind; label: string }[] = [
  { value: 'affirmation', label: 'Affirmation' },
  { value: 'quote', label: 'Quote' },
  { value: 'money', label: 'Money wisdom' },
  { value: 'health', label: 'Health nudge' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'gita', label: 'Gita wisdom' },
  { value: 'mix', label: 'Surprise me' }
];

export const inspirationLabel = (kind: InspirationKind) =>
  INSPIRATION_KINDS.find((option) => option.value === kind)?.label ?? 'Inspiration';
