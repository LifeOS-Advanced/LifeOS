import type { CarryForwardThread, WeeklyNarrativeRecap, WeeklyReview } from './types';
import { ymd } from './insights';

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return ymd(d);
}

export function nextWeekStart(weekStart: string) {
  return addDays(weekStart, 7);
}

export function currentWeekStart(today = new Date().toISOString().split('T')[0]) {
  const d = new Date(`${today}T00:00:00.000Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return ymd(d);
}

export function buildCarryForwardFromNarrative(recap: WeeklyNarrativeRecap): CarryForwardThread | undefined {
  const text = recap.unfinishedThread.trim();
  if (!text) return undefined;
  const source = recap.neglectedArea && text.includes(recap.neglectedArea.label)
    ? 'neglected_area'
    : text.startsWith('Close ')
      ? 'incomplete_loop'
      : text.startsWith('Close this week')
        ? 'review'
        : text.startsWith('Give ')
          ? 'paused_goal'
          : 'manual';

  return {
    text,
    source,
    sourceArea: source === 'neglected_area' ? recap.neglectedArea?.area : undefined,
    status: 'open',
    createdFromWeekStart: recap.weekStart,
    targetWeekStart: nextWeekStart(recap.weekStart),
  };
}

export function getLatestOpenCarryForward(reviews: WeeklyReview[], today = new Date().toISOString().split('T')[0]) {
  const weekStart = currentWeekStart(today);
  return [...reviews]
    .filter(review => review.weekStart <= weekStart)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
    .find(review => {
      const carry = review.carryForward;
      return Boolean(carry?.text?.trim() && carry.status === 'open');
    }) ?? null;
}

export function updateCarryForwardStatus(review: WeeklyReview, status: CarryForwardThread['status']): WeeklyReview {
  return {
    ...review,
    carryForward: review.carryForward
      ? { ...review.carryForward, status }
      : undefined,
  };
}
