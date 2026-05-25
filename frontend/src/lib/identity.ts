import type {
  DailyStart,
  EveningShutdown,
  FocusSession,
  Goal,
  Habit,
  IdentitySignal,
  LifeArea,
  Note,
  RewardEventType,
  Task,
  UserProfile,
  WeeklyNarrativeRecap,
  WeeklyReview,
} from './types';
import { LIFE_AREAS } from './life-areas';
import { lastNDates, startOfWeek, ymd } from './insights';

const areaLabel = (area?: LifeArea | string) =>
  area ? LIFE_AREAS.find(item => item.id === area)?.label ?? String(area) : undefined;

export function buildIdentityMessage(type?: RewardEventType | string): string {
  switch (type) {
    case 'task_completed':
      return 'Task completed.';
    case 'habit_checked':
      return 'Habit checked.';
    case 'focus_completed':
      return 'Focus session completed.';
    case 'daily_start':
      return 'Daily Start completed.';
    case 'evening_shutdown':
      return 'Day closed.';
    case 'weekly_review':
      return 'Weekly review saved.';
    default:
      return 'Progress recorded.';
  }
}

export function buildWhyThisMatters(opts: {
  type?: RewardEventType | string;
  profile?: UserProfile | null;
  goalTitle?: string;
  lifeArea?: LifeArea | string;
  mainPriority?: string;
  dailyStartDone?: boolean;
}): string | null {
  if (opts.goalTitle) return `This contributed to your ${opts.goalTitle} goal.`;
  const label = areaLabel(opts.lifeArea);
  if (label) return `This moved ${label} forward today.`;
  if (opts.dailyStartDone) return 'This helped close today’s loop.';
  if (opts.mainPriority) return `This connected back to today’s priority: ${opts.mainPriority}.`;
  return null;
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return ymd(d);
}

export function computeClosedLoopDays(input: {
  dailyStarts: DailyStart[];
  eveningShutdowns: EveningShutdown[];
  rewardDates?: string[];
}) {
  const startDays = new Set(input.dailyStarts.map(flow => flow.date));
  const shutdownDays = new Set(input.eveningShutdowns.map(flow => flow.date));
  const meaningfulDays = new Set(input.rewardDates ?? []);
  return [...startDays].filter(date => shutdownDays.has(date) && (meaningfulDays.size === 0 || meaningfulDays.has(date)));
}

export function buildIdentitySignal(input: {
  tasks: Task[];
  habits: Habit[];
  sessions: FocusSession[];
  goals: Goal[];
  progressEvents?: { type: RewardEventType; date: string; metadata?: Record<string, unknown> }[];
  dailyStarts?: DailyStart[];
  eveningShutdowns?: EveningShutdown[];
}): IdentitySignal {
  const days = lastNDates(14);
  const week = lastNDates(7);
  const recentTasks = input.tasks.filter(task => task.status === 'done' && days.includes((task.createdAt ?? '').slice(0, 10)));
  const recentHabitChecks = input.habits.reduce((count, habit) => count + (habit.completedDates ?? []).filter(date => week.includes(date)).length, 0);
  const recentFocus = input.sessions.filter(session => week.includes(session.completedAt));
  const closedDays = computeClosedLoopDays({
    dailyStarts: input.dailyStarts ?? [],
    eveningShutdowns: input.eveningShutdowns ?? [],
    rewardDates: input.progressEvents?.map(event => event.date),
  });

  if (closedDays.length >= 3) {
    return {
      title: `You closed ${closedDays.length} days this week.`,
      description: `You closed ${closedDays.length} day${closedDays.length === 1 ? '' : 's'} with intention this week.`,
      detail: 'Daily Start, meaningful work, and Evening Shutdown all happened on those days.',
      tone: 'consistency',
    };
  }
  if (recentFocus.length >= 2) {
    return {
      title: `You completed ${recentFocus.length} focus sessions this week.`,
      description: `${recentFocus.length} saved focus session${recentFocus.length === 1 ? '' : 's'} gave your attention a visible record.`,
      tone: 'focus',
    };
  }
  if (recentHabitChecks >= 5) {
    return {
      title: `${recentHabitChecks} habit checks this week.`,
      description: `${recentHabitChecks} checked habit${recentHabitChecks === 1 ? '' : 's'} is a concrete consistency signal.`,
      tone: 'consistency',
    };
  }
  if (recentTasks.length >= 3) {
    return {
      title: `${recentTasks.length} completed tasks in the last 14 days.`,
      description: `${recentTasks.length} completed task${recentTasks.length === 1 ? '' : 's'} is visible follow-through.`,
      tone: 'follow-through',
    };
  }
  return {
    title: 'Start the evidence.',
    description: 'One small completed loop is enough to start the pattern.',
    detail: 'Daily Start, one meaningful action, and Evening Shutdown make the first complete day.',
    tone: 'start',
  };
}

export function buildWeeklyNarrative(input: {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  notes: Note[];
  sessions: FocusSession[];
  dailyStarts: DailyStart[];
  eveningShutdowns: EveningShutdown[];
  reviews: WeeklyReview[];
  weekStart?: string;
  progressEvents?: { type: RewardEventType; date: string; metadata?: Record<string, unknown> }[];
}): WeeklyNarrativeRecap {
  const weekStart = input.weekStart ?? ymd(startOfWeek());
  const weekEnd = addDays(weekStart, 6);
  const inWeek = (date?: string) => !!date && date >= weekStart && date <= weekEnd;
  const areaCounts = new Map<LifeArea, number>();
  const focusByArea = new Map<LifeArea, number>();
  const usedAreas = new Set<LifeArea>();
  const bump = (area: LifeArea | undefined, amount = 1) => {
    if (!area) return;
    usedAreas.add(area);
    areaCounts.set(area, (areaCounts.get(area) ?? 0) + amount);
  };

  input.tasks.forEach(task => { if (task.lifeArea) usedAreas.add(task.lifeArea); });
  input.habits.forEach(habit => { if (habit.lifeArea) usedAreas.add(habit.lifeArea); });
  input.goals.forEach(goal => { if (goal.lifeArea) usedAreas.add(goal.lifeArea); });
  input.notes.forEach(note => { if (note.lifeArea) usedAreas.add(note.lifeArea); });

  const completedTasks = input.tasks.filter(task => task.status === 'done' && inWeek(task.createdAt?.slice(0, 10)));
  completedTasks.forEach(task => bump(task.lifeArea, 2));

  const habitChecks = input.habits.reduce((total, habit) => {
    const checks = (habit.completedDates ?? []).filter(inWeek);
    if (checks.length) bump(habit.lifeArea, checks.length);
    return total + checks.length;
  }, 0);

  const taskById = new Map(input.tasks.map(task => [task.id, task]));
  const weekSessions = input.sessions.filter(session => inWeek(session.completedAt));
  weekSessions.forEach(session => {
    const area = taskById.get(session.taskId ?? '')?.lifeArea;
    if (!area) return;
    bump(area, 1.5);
    focusByArea.set(area, (focusByArea.get(area) ?? 0) + session.duration);
  });

  const goalsMoved = input.goals.filter(goal => goal.progress > 0 && inWeek(goal.createdAt?.slice(0, 10)));
  goalsMoved.forEach(goal => bump(goal.lifeArea, 2));

  const dailyStarts = input.dailyStarts.filter(flow => inWeek(flow.date));
  const eveningShutdowns = input.eveningShutdowns.filter(flow => inWeek(flow.date));
  const meaningfulDates = input.progressEvents?.filter(event => inWeek(event.date)).map(event => event.date) ?? [];
  const closedLoopDays = computeClosedLoopDays({ dailyStarts, eveningShutdowns, rewardDates: meaningfulDates });
  const strongestEntry = [...areaCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const neglectedArea = [...usedAreas].find(area => !areaCounts.has(area));
  const totalFocusMinutes = weekSessions.reduce((total, session) => total + session.duration, 0);
  const hasActivity = completedTasks.length + habitChecks + weekSessions.length + goalsMoved.length + dailyStarts.length + eveningShutdowns.length > 0;
  const topFocus = [...focusByArea.entries()].sort((a, b) => b[1] - a[1])[0];
  const movedGoalIds = new Set(goalsMoved.map(goal => goal.id));
  const pausedGoal = input.goals.find(goal => goal.progress > 0 && goal.progress < 100 && !movedGoalIds.has(goal.id));
  const incompleteLoops = Math.max(0, dailyStarts.length - closedLoopDays.length);

  const identityReflection = closedLoopDays.length >= 3
    ? `${closedLoopDays.length} days had the full start-work-shutdown loop.`
    : weekSessions.length >= 2
      ? `${weekSessions.length} focus sessions were recorded this week.`
      : habitChecks >= 5
        ? `${habitChecks} habit checks made consistency visible this week.`
        : completedTasks.length >= 3
          ? `${completedTasks.length} completed tasks gave the week a follow-through signal.`
          : hasActivity
            ? 'This week has early evidence to build on.'
            : 'One small completed loop is enough to start the pattern.';

  const summary = hasActivity
    ? `${strongestEntry ? areaLabel(strongestEntry[0]) : 'Your priorities'} had the strongest activity this week${topFocus ? `, with ${areaLabel(topFocus[0])} receiving the most focus time` : ''}. You closed ${closedLoopDays.length} daily loop${closedLoopDays.length === 1 ? '' : 's'} and showed up for ${habitChecks} habit check${habitChecks === 1 ? '' : 's'}.`
    : 'This week has not built a clear story yet. Start with one intentional action, then close the day so LifeOS can remember it.';
  const unfinishedThread = pausedGoal
    ? `Give ${pausedGoal.title} one small next action.`
    : neglectedArea
      ? `Give ${areaLabel(neglectedArea)} one small action next.`
      : incompleteLoops > 0
        ? `Close ${incompleteLoops} started day${incompleteLoops === 1 ? '' : 's'} with Evening Shutdown next time.`
        : input.reviews.some(review => review.weekStart === weekStart)
          ? 'Carry the clearest priority into Daily Start.'
          : 'Close this week with a short review.';

  return {
    weekStart,
    weekEnd,
    weekLabel: `Week of ${new Date(`${weekStart}T00:00:00.000Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
    summary,
    identityReflection,
    unfinishedThread,
    strongestArea: strongestEntry ? { area: strongestEntry[0], label: areaLabel(strongestEntry[0])!, count: Number(strongestEntry[1].toFixed(1)) } : null,
    neglectedArea: neglectedArea ? { area: neglectedArea, label: areaLabel(neglectedArea)!, count: 0 } : null,
    focusDistribution: [...focusByArea.entries()].sort((a, b) => b[1] - a[1]).map(([area, minutes]) => ({ area, label: areaLabel(area)!, minutes })),
    stats: {
      tasksCompleted: completedTasks.length,
      habitChecks,
      focusMinutes: totalFocusMinutes,
      focusSessions: weekSessions.length,
      goalsMoved: goalsMoved.length,
      dailyStarts: dailyStarts.length,
      eveningShutdowns: eveningShutdowns.length,
      closedLoopDays: closedLoopDays.length,
      meaningfulActionDays: new Set(meaningfulDates).size,
      loopClosureRate: dailyStarts.length === 0 ? 0 : Math.round((closedLoopDays.length / dailyStarts.length) * 100),
    },
    review: input.reviews.find(review => review.weekStart === weekStart) ?? null,
  };
}
