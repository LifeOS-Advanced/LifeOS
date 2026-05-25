import {
  Task,
  Habit,
  Goal,
  FocusSession,
  LifeArea,
  DailyCheckIn,
  DailyStart,
  EveningShutdown,
  LifeMomentum,
  Note,
  WeeklyReview,
} from './types';
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
  [...tasks, ...habits, ...goals].forEach(({ lifeArea }) => {
    if (lifeArea) allUsedAreas.add(lifeArea);
  });
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

/** Consecutive days ending today with a habit check-in */
export function consecutiveHabitStreak(completedDates: string[], today = ymd(new Date())): number {
  const set = new Set(completedDates);
  const d = new Date(`${today}T12:00:00`);
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (set.has(ymd(d))) streak++;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
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

  const bestHabitStreak = habits.reduce((m, h) => Math.max(m, consecutiveHabitStreak(h.completedDates ?? [])), 0);

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

const scoreCap = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const daysSince = (date?: string | null) => {
  if (!date) return null;
  const today = new Date(`${ymd(new Date())}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.floor((today - new Date(`${date}T00:00:00.000Z`).getTime()) / (24 * 60 * 60 * 1000)));
};

const maxDate = (a?: string, b?: string) => {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
};

export function computeLifeMomentum(input: {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  notes: Note[];
  sessions: FocusSession[];
  checkIns: DailyCheckIn[];
  reviews: WeeklyReview[];
  dailyStart?: DailyStart | null;
  eveningShutdown?: EveningShutdown | null;
  periodDays?: number;
}): LifeMomentum {
  const periodDays = input.periodDays ?? 30;
  const days = lastNDates(periodDays);
  const periodStart = days[0];
  const today = ymd(new Date());
  const weekStart = ymd(startOfWeek());
  const completedTasks = input.tasks.filter(task => task.status === 'done' && (task.createdAt ?? today) >= periodStart);
  const dailyHabits = input.habits.filter(habit => habit.frequency === 'daily');
  const possibleHabitCompletions = dailyHabits.length * periodDays;
  const habitCompletions = input.habits.reduce(
    (total, habit) => total + (habit.completedDates ?? []).filter(date => date >= periodStart).length,
    0,
  );
  const periodSessions = input.sessions.filter(session => session.completedAt >= periodStart);
  const focusMinutes = periodSessions.reduce((total, session) => total + (session.duration || 0), 0);
  const activeGoals = input.goals.filter(goal => goal.progress < 100);
  const goalMomentum = activeGoals.length === 0
    ? 0
    : activeGoals.reduce((total, goal) => total + goal.progress, 0) / activeGoals.length;
  const currentWeekReview = input.reviews.find(review => review.weekStart === weekStart);

  const components = {
    tasks: scoreCap((completedTasks.length / Math.max(3, periodDays / 3)) * 100),
    habits: possibleHabitCompletions === 0 ? 0 : scoreCap((habitCompletions / possibleHabitCompletions) * 100),
    focus: scoreCap((focusMinutes / Math.max(25, periodDays * 25)) * 100),
    goals: scoreCap(goalMomentum),
    checkIns: scoreCap((input.checkIns.filter(checkIn => checkIn.date >= periodStart).length / periodDays) * 100),
    reviews: currentWeekReview ? 100 : 0,
    dailyLoop: (input.dailyStart ? 50 : 0) + (input.eveningShutdown ? 50 : 0),
  };

  const score = scoreCap(
    components.tasks * 0.2 +
    components.habits * 0.22 +
    components.focus * 0.14 +
    components.goals * 0.16 +
    components.checkIns * 0.1 +
    components.reviews * 0.08 +
    components.dailyLoop * 0.1,
  );

  const usedAreas = new Set<LifeArea>();
  const activity: { area: LifeArea; date: string; weight: number }[] = [];
  const addArea = (area?: LifeArea) => { if (area) usedAreas.add(area); };
  const addActivity = (area: LifeArea | undefined, date: string, weight: number) => {
    if (!area) return;
    usedAreas.add(area);
    activity.push({ area, date, weight });
  };
  const taskById = new Map(input.tasks.map(task => [task.id, task]));

  input.tasks.forEach(task => {
    addArea(task.lifeArea);
    if (task.status === 'done') addActivity(task.lifeArea, task.createdAt ?? today, 2);
  });
  input.habits.forEach(habit => {
    addArea(habit.lifeArea);
    (habit.completedDates ?? []).forEach(date => addActivity(habit.lifeArea, date, 1));
  });
  input.goals.forEach(goal => {
    addArea(goal.lifeArea);
    if (goal.progress > 0) addActivity(goal.lifeArea, goal.createdAt ?? today, 2);
  });
  input.notes.forEach(note => {
    addArea(note.lifeArea);
    addActivity(note.lifeArea, note.updatedAt ?? note.createdAt, 0.5);
  });
  periodSessions.forEach(session => {
    const linkedTask = session.taskId ? taskById.get(session.taskId) : undefined;
    addActivity(linkedTask?.lifeArea, session.completedAt, 1.5);
  });

  const areas = [...usedAreas].map(area => {
    const meta = LIFE_AREAS.find(item => item.id === area);
    const areaActivity = activity.filter(item => item.area === area);
    const recentActivity = areaActivity.filter(item => item.date >= periodStart);
    const lastActivityDate = areaActivity.reduce<string | undefined>((latest, item) => maxDate(latest, item.date), undefined);
    const daysSinceActivity = daysSince(lastActivityDate);
    const activityCount = Number(recentActivity.reduce((total, item) => total + item.weight, 0).toFixed(1));
    const status = daysSinceActivity === null
      ? 'empty'
      : daysSinceActivity >= 10
        ? 'neglected'
        : daysSinceActivity >= 5
          ? 'watch'
          : 'active';

    return {
      area,
      label: meta?.label ?? area,
      activityCount,
      lastActivityDate: lastActivityDate ?? null,
      daysSinceActivity,
      score: scoreCap((activityCount / Math.max(2, periodDays / 7)) * 100),
      status,
    };
  }).sort((a, b) => {
    if (a.status === 'neglected' && b.status !== 'neglected') return -1;
    if (b.status === 'neglected' && a.status !== 'neglected') return 1;
    return b.activityCount - a.activityCount;
  });

  const warnings = areas
    .filter(area => area.status === 'neglected' || area.status === 'watch')
    .slice(0, 3)
    .map(area => ({
      area: area.area,
      label: area.label,
      daysSinceActivity: area.daysSinceActivity,
      message: area.daysSinceActivity === null
        ? `${area.label} has no recorded progress yet.`
        : `${area.label} has not had meaningful progress in ${area.daysSinceActivity} days.`,
    }));

  const weakestArea = areas.find(area => area.status === 'neglected') ?? areas.find(area => area.status === 'watch');
  const suggestions = [
    !input.dailyStart ? { title: 'Start today deliberately', description: 'Run Daily Start to pick the priority, top tasks, habits, and focus block.', route: '/app/daily-start' } : null,
    weakestArea ? { title: `Move ${weakestArea.label} forward`, description: `Add one small task or habit so ${weakestArea.label} is not ignored this week.`, route: '/app/tasks?new=1' } : null,
    !currentWeekReview ? { title: 'Close the weekly loop', description: 'Use Weekly Review to turn this week into next week priorities.', route: '/app/review' } : null,
    !input.eveningShutdown ? { title: 'Protect tomorrow morning', description: "Evening Shutdown parks unfinished work and chooses tomorrow's first move.", route: '/app/evening-shutdown' } : null,
  ].filter(Boolean) as LifeMomentum['suggestions'];

  return {
    score,
    label: score >= 80 ? 'Strong momentum' : score >= 60 ? 'Steady momentum' : score >= 40 ? 'Needs attention' : 'Rebuild the loop',
    periodDays,
    components,
    week: {
      tasksCompleted: completedTasks.length,
      habitConsistency: components.habits,
      focusMinutes,
      checkInDays: input.checkIns.filter(checkIn => checkIn.date >= periodStart).length,
      reviewDone: Boolean(currentWeekReview),
    },
    today: {
      dailyStartDone: Boolean(input.dailyStart),
      eveningShutdownDone: Boolean(input.eveningShutdown),
    },
    areas,
    warnings,
    suggestions,
  };
}
