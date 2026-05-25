import type { DailyQuest, UserProgress } from './types';

export type DailyLoopPhase =
  | 'start_day'
  | 'next_quest'
  | 'close_day'
  | 'complete';

export interface DailyLoopHero {
  phase: DailyLoopPhase;
  title: string;
  /** Lowercase action line shown as "Next: …" */
  nextLine: string;
  description: string;
  ctaLabel: string;
  route: string;
}

const QUEST_ROUTES: Record<string, string> = {
  daily_start_1: '/app/daily-start',
  tasks_3: '/app/tasks',
  focus_1: '/app/focus',
  habits_2: '/app/habits',
  area_1: '/app/tasks',
  shutdown_1: '/app/evening-shutdown',
};

export function questRoute(quest: DailyQuest): string {
  return QUEST_ROUTES[quest.id] ?? '/app';
}

export function getNextIncompleteQuest(quests: DailyQuest[]): DailyQuest | undefined {
  return quests.find(q => !q.completed);
}

export function buildDailyLoopHero(opts: {
  dailyStartDone: boolean;
  eveningShutdownDone: boolean;
  quests: DailyQuest[];
}): DailyLoopHero {
  const { dailyStartDone, eveningShutdownDone, quests } = opts;
  const next = getNextIncompleteQuest(quests);
  const allQuestsDone = quests.length > 0 && quests.every(q => q.completed);

  if (!dailyStartDone) {
    return {
      phase: 'start_day',
      title: 'Start your day',
      nextLine: 'start your day',
      description: 'Set your priority in under two minutes — your first XP is one tap away.',
      ctaLabel: 'Daily Start',
      route: '/app/daily-start',
    };
  }

  if (next) {
    const nextLine =
      next.id === 'focus_1'
        ? 'complete one focus sprint'
        : next.id === 'habits_2'
          ? 'check 2 habits'
          : next.id === 'tasks_3'
            ? 'complete 3 tasks'
            : next.id === 'daily_start_1'
              ? 'start your day'
              : next.id === 'shutdown_1'
                ? 'close the day'
                : next.label.toLowerCase();
    return {
      phase: 'next_quest',
      title: next.label,
      nextLine,
      description: `${Math.min(next.current, next.target)}/${next.target} on this quest.`,
      ctaLabel: 'Continue',
      route: questRoute(next),
    };
  }

  if (!eveningShutdownDone && allQuestsDone) {
    return {
      phase: 'close_day',
      title: 'Close the day',
      nextLine: 'close the day',
      description: 'Quests are done. Reflect and park tomorrow’s first move.',
      ctaLabel: 'Evening Shutdown',
      route: '/app/evening-shutdown',
    };
  }

  if (!eveningShutdownDone) {
    return {
      phase: 'close_day',
      title: 'Wind down',
      nextLine: 'close the day',
      description: 'Review what moved and set tomorrow’s first task.',
      ctaLabel: 'Evening Shutdown',
      route: '/app/evening-shutdown',
    };
  }

  return {
    phase: 'complete',
    title: 'Day complete',
    nextLine: 'view your progress',
    description: 'Morning and evening loops closed. Momentum is building.',
    ctaLabel: 'View progress',
    route: '/app/progress',
  };
}

export function isStreakAtRisk(
  progress: UserProgress | undefined,
  timezone: string,
  hourThreshold = 18,
): boolean {
  if (!progress?.lastActivityDate || progress.dailyStreak < 1) return false;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  if (progress.lastActivityDate === today) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: timezone });
  if (progress.lastActivityDate !== yesterdayStr) return false;
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(new Date()),
  );
  const hasActivityToday = progress.recentEvents.some(e => e.date === today);
  return hour >= hourThreshold && !hasActivityToday;
}

export const FIRST_WEEK_KEY = 'lifeos_first_week_started';
export const FIRST_WEEK_DISMISS_KEY = 'lifeos_first_week_dismissed';

export function markFirstWeekStarted() {
  if (!localStorage.getItem(FIRST_WEEK_KEY)) {
    localStorage.setItem(FIRST_WEEK_KEY, new Date().toISOString());
  }
}

export interface FirstWeekStep {
  id: string;
  label: string;
  done: boolean;
  route: string;
}

export function buildFirstWeekSteps(opts: {
  dailyStartDone: boolean;
  habitChecked: boolean;
  focusDone: boolean;
  eveningShutdownDone: boolean;
  hasHabit: boolean;
}): FirstWeekStep[] {
  return [
    {
      id: 'daily_start',
      label: 'Complete Daily Start',
      done: opts.dailyStartDone,
      route: '/app/daily-start',
    },
    {
      id: 'habit',
      label: opts.hasHabit ? 'Check a habit today' : 'Create and check a habit',
      done: opts.habitChecked,
      route: '/app/habits',
    },
    {
      id: 'focus',
      label: 'Finish one focus sprint',
      done: opts.focusDone,
      route: '/app/focus',
    },
    {
      id: 'shutdown',
      label: 'Evening Shutdown once',
      done: opts.eveningShutdownDone,
      route: '/app/evening-shutdown',
    },
  ];
}

export function shouldShowFirstWeekCard(): boolean {
  if (localStorage.getItem(FIRST_WEEK_DISMISS_KEY)) return false;
  const started = localStorage.getItem(FIRST_WEEK_KEY);
  if (!started) return false;
  const days = (Date.now() - new Date(started).getTime()) / (24 * 60 * 60 * 1000);
  return days <= 7;
}

export const FIRST_VISIT_GUIDE_KEY = 'lifeos_first_visit_guide_seen';

export function shouldShowFirstVisitGuide(): boolean {
  return !localStorage.getItem(FIRST_VISIT_GUIDE_KEY);
}

export function markFirstVisitGuideSeen() {
  localStorage.setItem(FIRST_VISIT_GUIDE_KEY, '1');
  localStorage.removeItem('lifeos_pending_first_visit_guide');
}

/** 0–100: daily loop closure weighted by start, quests, shutdown */
export function getDailyLoopProgress(opts: {
  dailyStartDone: boolean;
  eveningShutdownDone: boolean;
  quests: DailyQuest[];
}): {
  percent: number;
  completedSteps: number;
  totalSteps: number;
  questsDone: number;
  questsTotal: number;
  label: string;
} {
  const questTotal = Math.max(1, opts.quests.length);
  const questsDone = opts.quests.filter(q => q.completed).length;
  const questPart = (questsDone / questTotal) * 60;
  const startPart = opts.dailyStartDone ? 20 : 0;
  const shutdownPart = opts.eveningShutdownDone ? 20 : 0;
  const percent = Math.min(100, Math.round(startPart + questPart + shutdownPart));
  const completedSteps =
    (opts.dailyStartDone ? 1 : 0) + questsDone + (opts.eveningShutdownDone ? 1 : 0);
  const totalSteps = 1 + questTotal + 1;
  const label =
    percent >= 100
      ? 'Day complete'
      : percent >= 60
        ? 'Almost there'
        : percent >= 20
          ? 'Building momentum'
          : 'Just getting started';
  return { percent, completedSteps, totalSteps, questsDone, questsTotal: questTotal, label };
}

export function isNewUserSession(): boolean {
  const started = localStorage.getItem(FIRST_WEEK_KEY);
  if (!started) return false;
  const days = (Date.now() - new Date(started).getTime()) / (24 * 60 * 60 * 1000);
  return days <= 3;
}
