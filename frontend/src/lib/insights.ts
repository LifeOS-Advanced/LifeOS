import { Task, Habit, Goal, FocusSession, LifeArea, DailyCheckIn } from './types';
import { LIFE_AREAS } from './life-areas';

export const ymd = (d: Date) => d.toISOString().split('T')[0];

export function startOfWeek(d = new Date()): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export function lastNDates(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(ymd(d));
  }
  return out;
}

export interface WeeklyStats {
  weekStart: string;
  tasksCompleted: number;
  habitConsistency: number; // 0-100
  focusMinutes: number;
  focusSessions: number;
  goalsProgressed: number;
  topArea?: { area: LifeArea; label: string; count: number };
  neglectedArea?: { area: LifeArea; label: string; count: number };
  byDay: { date: string; tasks: number; habits: number; focus: number }[];
}

export function computeWeeklyStats(
  tasks: Task[],
  habits: Habit[],
  goals: Goal[],
  sessions: FocusSession[],
): WeeklyStats {
  const start = startOfWeek();
  const days = lastNDates(7);
  const startStr = days[0];

  const tasksCompleted = tasks.filter(t => t.status === 'done' && t.createdAt >= startStr).length;

  // Habit consistency: across daily habits, fraction of expected days completed in the window
  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  let possible = 0;
  let done = 0;
  dailyHabits.forEach(h => {
    days.forEach(d => {
      possible += 1;
      if (h.completedDates?.includes(d)) done += 1;
    });
  });
  const habitConsistency = possible === 0 ? 0 : Math.round((done / possible) * 100);

  const weekSessions = sessions.filter(s => s.completedAt >= startStr);
  const focusMinutes = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  const goalsProgressed = goals.filter(g => g.progress > 0 && g.progress < 100).length;

  // Life-area activity
  const areaCounts = new Map<LifeArea, number>();
  const bump = (a?: LifeArea) => { if (a) areaCounts.set(a, (areaCounts.get(a) || 0) + 1); };
  tasks.filter(t => t.status === 'done' && t.createdAt >= startStr).forEach(t => bump(t.lifeArea));
  habits.forEach(h => h.completedDates?.filter(d => d >= startStr).forEach(() => bump(h.lifeArea)));
  weekSessions.forEach(s => {
    const linkedTask = tasks.find(t => t.id === s.taskId);
    bump(linkedTask?.lifeArea);
  });

  let top: WeeklyStats['topArea'];
  let neglected: WeeklyStats['neglectedArea'];
  if (areaCounts.size > 0) {
    const sorted = [...areaCounts.entries()].sort((a, b) => b[1] - a[1]);
    const [topId, topCount] = sorted[0];
    top = { area: topId, label: LIFE_AREAS.find(a => a.id === topId)?.label || topId, count: topCount };
  }
  // Neglected = an area used in any tracked entity that has 0 activity this week
  const allUsedAreas = new Set<LifeArea>();
  [...tasks, ...habits, ...goals].forEach(x => { if ((x as any).lifeArea) allUsedAreas.add((x as any).lifeArea); });
  const neglectedCandidates = [...allUsedAreas].filter(a => !areaCounts.has(a));
  if (neglectedCandidates.length > 0) {
    const a = neglectedCandidates[0];
    neglected = { area: a, label: LIFE_AREAS.find(x => x.id === a)?.label || a, count: 0 };
  }

  const byDay = days.map(d => ({
    date: d,
    tasks: tasks.filter(t => t.status === 'done' && t.createdAt.startsWith(d)).length,
    habits: habits.reduce((n, h) => n + (h.completedDates?.includes(d) ? 1 : 0), 0),
    focus: sessions.filter(s => s.completedAt === d).reduce((sum, s) => sum + (s.duration || 0), 0),
  }));

  return {
    weekStart: ymd(start),
    tasksCompleted,
    habitConsistency,
    focusMinutes,
    focusSessions: weekSessions.length,
    goalsProgressed,
    topArea: top,
    neglectedArea: neglected,
    byDay,
  };
}

export interface ConsistencyStats {
  checkInStreak: number;
  weeklyScore: number; // 0-100
  bestHabitStreak: number;
  focusStreak: number; // consecutive days with at least one focus session
  goalMomentum: number; // average progress across active goals
}

export function computeConsistency(
  habits: Habit[],
  sessions: FocusSession[],
  goals: Goal[],
  checkIns: DailyCheckIn[],
): ConsistencyStats {
  // Check-in streak
  let checkInStreak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const has = checkIns.some(c => c.date === ymd(d));
    if (has) checkInStreak++;
    else break;
  }

  // Weekly score = blend of habit consistency, task completion, focus presence
  const week = lastNDates(7);
  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  let possible = 0, done = 0;
  dailyHabits.forEach(h => week.forEach(d => {
    possible += 1;
    if (h.completedDates?.includes(d)) done += 1;
  }));
  const habitPart = possible === 0 ? 0 : (done / possible) * 100;
  const focusDays = new Set(sessions.filter(s => week.includes(s.completedAt)).map(s => s.completedAt)).size;
  const focusPart = (focusDays / 7) * 100;
  const weeklyScore = Math.round(habitPart * 0.6 + focusPart * 0.4);

  const bestHabitStreak = habits.reduce((m, h) => Math.max(m, h.streak || 0), 0);

  let focusStreak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const has = sessions.some(s => s.completedAt === ymd(d));
    if (has) focusStreak++;
    else break;
  }

  const activeGoals = goals.filter(g => g.progress < 100);
  const goalMomentum = activeGoals.length === 0
    ? 0
    : Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length);

  return { checkInStreak, weeklyScore, bestHabitStreak, focusStreak, goalMomentum };
}
