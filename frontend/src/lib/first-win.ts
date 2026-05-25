import type { DailyQuest, Habit, ImprovementArea } from './types';
import { FIRST_WEEK_KEY, isNewUserSession } from './daily-loop';

export { isNewUserSession };

export const PENDING_FIRST_VISIT_GUIDE_KEY = 'lifeos_pending_first_visit_guide';
export const PENDING_FIRST_HABIT_KEY = 'lifeos_pending_first_habit';
export const FIRST_WIN_FLOW_KEY = 'lifeos_first_win_flow';
export const FIRST_XP_AT_KEY = 'lifeos_first_xp_at';

const TARGET_FIRST_XP_MS = 3 * 60 * 1000;

export type FirstWinFlow = 'guide' | 'daily_start' | 'habit_check' | 'done';

export function setPendingFirstVisitGuide() {
  localStorage.setItem(PENDING_FIRST_VISIT_GUIDE_KEY, '1');
}

export function consumePendingFirstVisitGuide(): boolean {
  if (!localStorage.getItem(PENDING_FIRST_VISIT_GUIDE_KEY)) return false;
  localStorage.removeItem(PENDING_FIRST_VISIT_GUIDE_KEY);
  return true;
}

export function shouldShowFirstVisitGuideNow(): boolean {
  return !!localStorage.getItem(PENDING_FIRST_VISIT_GUIDE_KEY);
}

export function setFirstWinFlow(flow: FirstWinFlow) {
  localStorage.setItem(FIRST_WIN_FLOW_KEY, flow);
}

export function getFirstWinFlow(): FirstWinFlow | null {
  return localStorage.getItem(FIRST_WIN_FLOW_KEY) as FirstWinFlow | null;
}

export function clearFirstWinFlow() {
  localStorage.removeItem(FIRST_WIN_FLOW_KEY);
}

export function setPendingFirstHabit(title: string) {
  localStorage.setItem(PENDING_FIRST_HABIT_KEY, title.trim());
}

export function consumePendingFirstHabit(): string | null {
  const title = localStorage.getItem(PENDING_FIRST_HABIT_KEY);
  if (!title) return null;
  localStorage.removeItem(PENDING_FIRST_HABIT_KEY);
  return title;
}

export function getSessionStartedAt(): number | null {
  const raw = localStorage.getItem(FIRST_WEEK_KEY);
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Call when user earns XP for the first time ever */
export function recordFirstXpIfNeeded(): { firstXp: boolean; elapsedMs: number | null } {
  if (localStorage.getItem(FIRST_XP_AT_KEY)) {
    return { firstXp: false, elapsedMs: null };
  }
  const now = Date.now();
  localStorage.setItem(FIRST_XP_AT_KEY, new Date(now).toISOString());
  const started = getSessionStartedAt();
  const elapsedMs = started ? now - started : null;
  return { firstXp: true, elapsedMs };
}

export function formatFirstXpElapsed(ms: number | null): string {
  if (ms == null) return 'under 3 minutes';
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec} seconds`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem > 0 ? `${min}m ${rem}s` : `${min} minute${min === 1 ? '' : 's'}`;
}

export function isUnderThreeMinuteTarget(ms: number | null): boolean {
  return ms != null && ms <= TARGET_FIRST_XP_MS;
}

export function defaultFirstHabitTitle(improvements: ImprovementArea[]): string {
  if (improvements.includes('health')) return 'Move my body';
  if (improvements.includes('focus')) return 'One focus block';
  if (improvements.includes('discipline')) return 'Show up daily';
  if (improvements.includes('studying')) return 'Study session';
  if (improvements.includes('productivity')) return 'Plan tomorrow';
  return 'One small win';
}

/** New users: steer to fastest first XP */
export function buildNewUserHeroOverride(opts: {
  dailyStartDone: boolean;
  habits: Habit[];
  quests: DailyQuest[];
  today: string;
}): { nextLine: string; route: string; ctaLabel: string } | null {
  if (!isNewUserSession()) return null;

  if (!opts.dailyStartDone) {
    return { nextLine: 'start your day', route: '/app/daily-start', ctaLabel: 'Daily Start' };
  }

  const hasHabit = opts.habits.length > 0;
  const habitChecked = opts.habits.some(h => h.completedDates?.includes(opts.today));

  if (!hasHabit || !habitChecked) {
    return { nextLine: 'create and check your first habit', route: '/app/habits?firstWin=1', ctaLabel: 'First win' };
  }

  const focusQuest = opts.quests.find(q => q.id === 'focus_1' && !q.completed);
  if (focusQuest) {
    return { nextLine: 'complete one focus sprint', route: '/app/focus', ctaLabel: 'Focus' };
  }

  return null;
}
