/** Which month the review opens on, and when the Overview points to it. */

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const monthName = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long' });
};

/** Early in a month the one that just finished is the interesting one. */
export function defaultReviewMonth(now = new Date()) {
  return monthKey(now.getDate() <= 7 ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : now);
}

/** A quiet link on the Overview, only around the turn of the month. */
export function reviewNudge(now = new Date()): { month: string; text: string } | null {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (now.getDate() <= 7) {
    const month = defaultReviewMonth(now);
    return { month, text: `Your ${monthName(month)} in review is ready` };
  }
  if (now.getDate() >= lastDay - 3) {
    const month = monthKey(now);
    return { month, text: `See how ${monthName(month)} is shaping up` };
  }
  return null;
}
