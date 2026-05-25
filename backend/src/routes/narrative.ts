import { Router, Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { Goal } from '../models/Goal';
import { Habit } from '../models/Habit';
import { Task } from '../models/Task';
import { DailyStart, EveningShutdown, FocusSession, Note, UserProgress, WeeklyReview } from '../models/Index';
import { ok, AppError } from '../utils/response';

const router = Router();
router.use(protect);

const lifeAreaLabels: Record<string, string> = {
  work: 'Work',
  study: 'Learning',
  health: 'Health',
  money: 'Money',
  personal: 'Personal',
  family: 'Family',
  faith: 'Faith',
  projects: 'Projects',
};

const meaningfulTypes = new Set(['task_completed', 'habit_checked', 'focus_completed', 'daily_start', 'evening_shutdown', 'weekly_review']);

const ymd = (date: Date) => date.toISOString().split('T')[0];

function validate(req: Request, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0]?.msg ?? 'Validation failed', 400));
    return false;
  }
  return true;
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return ymd(d);
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return ymd(d);
}

function labelArea(area?: string) {
  return area ? lifeAreaLabels[area] ?? area : undefined;
}

function topEntry(map: Map<string, number>) {
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0];
}

router.get('/weekly', [
  query('weekStart').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;

    const weekStart = typeof req.query.weekStart === 'string' ? req.query.weekStart : startOfWeek();
    const weekEnd = addDays(weekStart, 6);

    const [tasks, habits, goals, notes, sessions, dailyStarts, shutdowns, reviews, progress] = await Promise.all([
      Task.find({ userId: req.userId }).lean(),
      Habit.find({ userId: req.userId }).lean(),
      Goal.find({ userId: req.userId }).lean(),
      Note.find({ userId: req.userId }).lean(),
      FocusSession.find({ userId: req.userId, completedAt: { $gte: weekStart, $lte: weekEnd } }).lean(),
      DailyStart.find({ userId: req.userId, date: { $gte: weekStart, $lte: weekEnd } }).lean(),
      EveningShutdown.find({ userId: req.userId, date: { $gte: weekStart, $lte: weekEnd } }).lean(),
      WeeklyReview.findOne({ userId: req.userId, weekStart }).lean(),
      UserProgress.findOne({ userId: req.userId }).lean(),
    ]);

    const taskById = new Map(tasks.map((task) => [String(task._id), task]));
    const usedAreas = new Set<string>();
    const areaCounts = new Map<string, number>();
    const focusByArea = new Map<string, number>();
    const bump = (area: string | undefined, amount = 1) => {
      if (!area) return;
      usedAreas.add(area);
      areaCounts.set(area, (areaCounts.get(area) ?? 0) + amount);
    };

    tasks.forEach((task) => { if (task.lifeArea) usedAreas.add(task.lifeArea); });
    habits.forEach((habit) => { if (habit.lifeArea) usedAreas.add(habit.lifeArea); });
    goals.forEach((goal) => { if (goal.lifeArea) usedAreas.add(goal.lifeArea); });
    notes.forEach((note) => { if (note.lifeArea) usedAreas.add(note.lifeArea); });

    const taskDoneDate = (task: { updatedAt?: Date; createdAt?: Date }) => ymd(task.updatedAt ?? task.createdAt ?? new Date());
    const completedTasks = tasks.filter((task) => task.status === 'done' && taskDoneDate(task) >= weekStart && taskDoneDate(task) <= weekEnd);
    completedTasks.forEach((task) => bump(task.lifeArea, 2));

    const habitChecks = habits.reduce((total, habit) => {
      const checks = (habit.completedDates ?? []).filter((date) => date >= weekStart && date <= weekEnd);
      if (checks.length > 0) bump(habit.lifeArea, checks.length);
      return total + checks.length;
    }, 0);

    sessions.forEach((session) => {
      const task = session.taskId ? taskById.get(String(session.taskId)) : undefined;
      const area = task?.lifeArea;
      if (!area) return;
      bump(area, 1.5);
      focusByArea.set(area, (focusByArea.get(area) ?? 0) + (session.duration ?? 0));
    });

    const goalsMoved = goals.filter((goal) => {
      const updated = ymd(goal.updatedAt ?? goal.createdAt ?? new Date());
      return (goal.progress ?? 0) > 0 && updated >= weekStart && updated <= weekEnd;
    });
    goalsMoved.forEach((goal) => bump(goal.lifeArea, 2));

    const progressEvents = (progress?.events ?? []).filter((event) => event.date >= weekStart && event.date <= weekEnd);
    const meaningfulDays = new Set(progressEvents.filter((event) => meaningfulTypes.has(event.type)).map((event) => event.date));
    const startDays = new Set(dailyStarts.map((flow) => flow.date));
    const shutdownDays = new Set(shutdowns.map((flow) => flow.date));
    const closedLoopDays = [...startDays].filter((date) => shutdownDays.has(date) && meaningfulDays.has(date));

    const strongest = topEntry(areaCounts);
    const neglectedArea = [...usedAreas].find((area) => !areaCounts.has(area));
    const topFocus = topEntry(focusByArea);
    const totalFocusMinutes = sessions.reduce((sum, session) => sum + (session.duration ?? 0), 0);
    const hasActivity = completedTasks.length + habitChecks + sessions.length + goalsMoved.length + dailyStarts.length + shutdowns.length > 0;
    const weekLabel = `Week of ${new Date(`${weekStart}T00:00:00.000Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const movedGoalIds = new Set(goalsMoved.map((goal) => String(goal._id)));
    const pausedGoal = goals.find((goal) => (goal.progress ?? 0) > 0 && (goal.progress ?? 0) < 100 && !movedGoalIds.has(String(goal._id)));
    const incompleteLoops = Math.max(0, dailyStarts.length - closedLoopDays.length);
    const identityReflection = closedLoopDays.length >= 3
      ? `${closedLoopDays.length} days had the full start-work-shutdown loop.`
      : sessions.length >= 2
        ? `${sessions.length} focus sessions were recorded this week.`
        : habitChecks >= 5
          ? `${habitChecks} habit checks made consistency visible this week.`
          : completedTasks.length >= 3
            ? `${completedTasks.length} completed tasks gave the week a follow-through signal.`
            : hasActivity
              ? 'This week has early evidence to build on.'
              : 'One small completed loop is enough to start the pattern.';
    const unfinishedThread = pausedGoal
      ? `Give ${pausedGoal.title} one small next action.`
      : neglectedArea
        ? `Give ${labelArea(neglectedArea)} one small action next.`
        : incompleteLoops > 0
          ? `Close ${incompleteLoops} started day${incompleteLoops === 1 ? '' : 's'} with Evening Shutdown next time.`
          : !reviews
            ? 'Close this week with a short review.'
            : 'Carry the clearest priority into Daily Start.';
    const summary = hasActivity
      ? `${strongest ? labelArea(strongest[0]) : 'Your priorities'} had the strongest activity this week${topFocus ? `, with ${labelArea(topFocus[0])} receiving the most focus time` : ''}. You closed ${closedLoopDays.length} daily loop${closedLoopDays.length === 1 ? '' : 's'} and showed up for ${habitChecks} habit check${habitChecks === 1 ? '' : 's'}.`
      : 'This week has not built a clear story yet. Start with one intentional action, then close the day so LifeOS can remember it.';

    ok(res, {
      weekStart,
      weekEnd,
      weekLabel,
      summary,
      identityReflection,
      unfinishedThread,
      strongestArea: strongest ? { area: strongest[0], label: labelArea(strongest[0]), count: Number(strongest[1].toFixed(1)) } : null,
      neglectedArea: neglectedArea ? { area: neglectedArea, label: labelArea(neglectedArea), count: 0 } : null,
      focusDistribution: [...focusByArea.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([area, minutes]) => ({ area, label: labelArea(area), minutes })),
      stats: {
        tasksCompleted: completedTasks.length,
        habitChecks,
        focusMinutes: totalFocusMinutes,
        focusSessions: sessions.length,
        goalsMoved: goalsMoved.length,
        dailyStarts: dailyStarts.length,
        eveningShutdowns: shutdowns.length,
        closedLoopDays: closedLoopDays.length,
        meaningfulActionDays: meaningfulDays.size,
        loopClosureRate: dailyStarts.length === 0 ? 0 : Math.round((closedLoopDays.length / dailyStarts.length) * 100),
      },
      review: reviews ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
