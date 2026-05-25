import { Router, Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { Goal } from '../models/Goal';
import { Habit } from '../models/Habit';
import { Task } from '../models/Task';
import { DailyCheckIn, DailyStart, EveningShutdown, FocusSession, Note, WeeklyReview } from '../models/Index';
import { ok, AppError } from '../utils/response';

const router = Router();
router.use(protect);

const lifeAreaLabels: Record<string, string> = {
  work: 'Work',
  study: 'Study',
  health: 'Health',
  money: 'Money',
  personal: 'Personal',
  family: 'Family',
  faith: 'Faith',
  projects: 'Projects',
};

const dayMs = 24 * 60 * 60 * 1000;

type ComponentKey = 'tasks' | 'habits' | 'focus' | 'goals' | 'checkIns' | 'reviews' | 'dailyLoop';

interface ActivityPoint {
  area: string;
  date: string;
  weight: number;
}

const ymd = (date: Date) => date.toISOString().split('T')[0];

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function startOfWeek(): string {
  const date = new Date();
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - day);
  return ymd(date);
}

function scoreCap(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function daysSince(date?: string) {
  if (!date) return null;
  const today = daysAgo(0).getTime();
  return Math.max(0, Math.floor((today - new Date(`${date}T00:00:00.000Z`).getTime()) / dayMs));
}

function maxDate(a?: string, b?: string) {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function validate(req: Request, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0]?.msg ?? 'Validation failed', 400));
    return false;
  }
  return true;
}

router.get('/', [
  query('periodDays').optional().isInt({ min: 7, max: 90 }).toInt(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;

    const periodDays = typeof req.query.periodDays === 'number' ? req.query.periodDays : 30;
    const today = ymd(new Date());
    const periodStart = ymd(daysAgo(periodDays - 1));
    const weekStart = startOfWeek();

    const [tasks, habits, goals, notes, sessions, checkIns, reviews, dailyStart, eveningShutdown] = await Promise.all([
      Task.find({ userId: req.userId }).lean(),
      Habit.find({ userId: req.userId }).lean(),
      Goal.find({ userId: req.userId }).lean(),
      Note.find({ userId: req.userId }).lean(),
      FocusSession.find({ userId: req.userId, completedAt: { $gte: periodStart } }).lean(),
      DailyCheckIn.find({ userId: req.userId, date: { $gte: periodStart } }).lean(),
      WeeklyReview.find({ userId: req.userId }).sort('-weekStart').limit(8).lean(),
      DailyStart.findOne({ userId: req.userId, date: today }).lean(),
      EveningShutdown.findOne({ userId: req.userId, date: today }).lean(),
    ]);

    const dateFromDoc = (value?: Date) => value ? ymd(value) : today;
    const taskDoneDate = (task: { updatedAt?: Date; createdAt?: Date }) => dateFromDoc(task.updatedAt ?? task.createdAt);
    const completedTasks = tasks.filter((task) => task.status === 'done' && taskDoneDate(task) >= periodStart);
    const dailyHabits = habits.filter((habit) => habit.frequency === 'daily');
    const possibleHabitCompletions = dailyHabits.length * periodDays;
    const habitCompletions = habits.reduce(
      (total, habit) => total + (habit.completedDates ?? []).filter((date) => date >= periodStart).length,
      0
    );
    const focusMinutes = sessions.reduce((total, session) => total + (session.duration ?? 0), 0);
    const activeGoals = goals.filter((goal) => goal.progress < 100);
    const goalMomentum = activeGoals.length === 0
      ? 0
      : activeGoals.reduce((total, goal) => total + (goal.progress ?? 0), 0) / activeGoals.length;
    const currentWeekReview = reviews.find((review) => review.weekStart === weekStart);
    const dailyLoopScore = (dailyStart ? 50 : 0) + (eveningShutdown ? 50 : 0);

    const components: Record<ComponentKey, number> = {
      tasks: scoreCap((completedTasks.length / Math.max(3, periodDays / 3)) * 100),
      habits: possibleHabitCompletions === 0 ? 0 : scoreCap((habitCompletions / possibleHabitCompletions) * 100),
      focus: scoreCap((focusMinutes / Math.max(25, periodDays * 25)) * 100),
      goals: scoreCap(goalMomentum),
      checkIns: scoreCap((checkIns.length / periodDays) * 100),
      reviews: currentWeekReview ? 100 : 0,
      dailyLoop: dailyLoopScore,
    };

    const score = scoreCap(
      components.tasks * 0.2 +
      components.habits * 0.22 +
      components.focus * 0.14 +
      components.goals * 0.16 +
      components.checkIns * 0.1 +
      components.reviews * 0.08 +
      components.dailyLoop * 0.1
    );

    const taskById = new Map(tasks.map((task) => [String(task._id), task]));
    const usedAreas = new Set<string>();
    const activity: ActivityPoint[] = [];
    const addArea = (area?: string) => { if (area) usedAreas.add(area); };
    const addActivity = (area: string | undefined, date: string, weight: number) => {
      if (!area) return;
      usedAreas.add(area);
      activity.push({ area, date, weight });
    };

    tasks.forEach((task) => {
      addArea(task.lifeArea);
      if (task.status === 'done') addActivity(task.lifeArea, taskDoneDate(task), 2);
    });
    habits.forEach((habit) => {
      addArea(habit.lifeArea);
      (habit.completedDates ?? []).forEach((date) => addActivity(habit.lifeArea, date, 1));
    });
    goals.forEach((goal) => {
      addArea(goal.lifeArea);
      if ((goal.progress ?? 0) > 0) addActivity(goal.lifeArea, dateFromDoc(goal.updatedAt ?? goal.createdAt), 2);
    });
    notes.forEach((note) => {
      addArea(note.lifeArea);
      addActivity(note.lifeArea, dateFromDoc(note.updatedAt ?? note.createdAt), 0.5);
    });
    sessions.forEach((session) => {
      const linkedTask = session.taskId ? taskById.get(String(session.taskId)) : undefined;
      addActivity(linkedTask?.lifeArea, session.completedAt, 1.5);
    });

    const areas = [...usedAreas].map((area) => {
      const areaActivity = activity.filter((item) => item.area === area);
      const recentActivity = areaActivity.filter((item) => item.date >= periodStart);
      const lastActivityDate = areaActivity.reduce<string | undefined>((latest, item) => maxDate(latest, item.date), undefined);
      const inactivityDays = daysSince(lastActivityDate);
      const activityCount = Number(recentActivity.reduce((total, item) => total + item.weight, 0).toFixed(1));
      const areaScore = scoreCap((activityCount / Math.max(2, periodDays / 7)) * 100);

      return {
        area,
        label: lifeAreaLabels[area] ?? area,
        activityCount,
        lastActivityDate: lastActivityDate ?? null,
        daysSinceActivity: inactivityDays,
        score: areaScore,
        status: inactivityDays === null ? 'empty' : inactivityDays >= 10 ? 'neglected' : inactivityDays >= 5 ? 'watch' : 'active',
      };
    }).sort((a, b) => {
      if (a.status === 'neglected' && b.status !== 'neglected') return -1;
      if (b.status === 'neglected' && a.status !== 'neglected') return 1;
      return b.activityCount - a.activityCount;
    });

    const warnings = areas
      .filter((area) => area.status === 'neglected' || area.status === 'watch')
      .slice(0, 3)
      .map((area) => ({
        area: area.area,
        label: area.label,
        daysSinceActivity: area.daysSinceActivity,
        message: area.daysSinceActivity === null
          ? `${area.label} has no recorded progress yet.`
          : `${area.label} has not had meaningful progress in ${area.daysSinceActivity} days.`,
      }));

    const weakestArea = areas.find((area) => area.status === 'neglected') ?? areas.find((area) => area.status === 'watch');
    const suggestions = [
      !dailyStart ? { title: 'Start today deliberately', description: 'Run Daily Start to pick the priority, top tasks, habits, and focus block.', route: '/app/daily-start' } : null,
      weakestArea ? { title: `Move ${weakestArea.label} forward`, description: `Add one small task or habit so ${weakestArea.label} is not ignored this week.`, route: '/app/tasks?new=1' } : null,
      !currentWeekReview ? { title: 'Close the weekly loop', description: 'Use Weekly Review to turn this week into next week priorities.', route: '/app/review' } : null,
      !eveningShutdown ? { title: 'Protect tomorrow morning', description: 'Evening Shutdown parks unfinished work and chooses tomorrow’s first move.', route: '/app/evening-shutdown' } : null,
    ].filter(Boolean);

    ok(res, {
      score,
      label: score >= 80 ? 'Strong momentum' : score >= 60 ? 'Steady momentum' : score >= 40 ? 'Needs attention' : 'Rebuild the loop',
      periodDays,
      components,
      week: {
        tasksCompleted: completedTasks.length,
        habitConsistency: components.habits,
        focusMinutes,
        checkInDays: checkIns.length,
        reviewDone: Boolean(currentWeekReview),
      },
      today: {
        dailyStartDone: Boolean(dailyStart),
        eveningShutdownDone: Boolean(eveningShutdown),
      },
      areas,
      warnings,
      suggestions,
    });
  } catch (err) { next(err); }
});

export default router;
