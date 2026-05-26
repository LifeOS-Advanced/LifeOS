import { Types } from 'mongoose';
import { UserProgress, RewardEventType } from '../models/Index';

export interface RewardEventInput {
  userId: Types.ObjectId | string;
  type: RewardEventType;
  date?: string;
  entityId?: string;
  title?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

const dayMs = 24 * 60 * 60 * 1000;

export const ymd = (date = new Date()) => date.toISOString().split('T')[0];

const xpRules: Record<RewardEventType, (input: RewardEventInput) => number> = {
  task_completed: () => 20,
  habit_checked: () => 15,
  focus_completed: (input) => Math.max(20, Math.min(120, Number(input.metadata?.duration ?? 25))),
  daily_start: () => 25,
  evening_shutdown: () => 30,
  weekly_review: () => 75,
  urge_interrupted: () => 20,
  replacement_completed: () => 15,
  relapse_reviewed: () => 25,
  discipline_routine_completed: () => 20,
  quest_bonus: () => 5,
  daily_quests_complete: () => 25,
};

const eventTitles: Record<RewardEventType, string> = {
  task_completed: 'Task completed',
  habit_checked: 'Habit checked',
  focus_completed: 'Focus sprint finished',
  daily_start: 'Daily Start completed',
  evening_shutdown: 'Evening Shutdown completed',
  weekly_review: 'Weekly Reset completed',
  urge_interrupted: 'Urge interrupted',
  replacement_completed: 'Replacement action completed',
  relapse_reviewed: 'Relapse review completed',
  discipline_routine_completed: 'Discipline routine completed',
  quest_bonus: 'Daily quest done',
  daily_quests_complete: 'All daily quests complete',
};

const QUEST_BONUS_XP = 5;
const ALL_QUESTS_BONUS_XP = 25;

const achievementDefinitions = {
  first_focus: {
    title: 'First Focus Session',
    description: 'Finished your first saved focus sprint.',
  },
  habit_7_day_streak: {
    title: '7-Day Habit Streak',
    description: 'Kept a habit alive for seven days.',
  },
  weekly_reset: {
    title: 'Weekly Reset Completed',
    description: 'Closed a week with a review.',
  },
  balanced_week: {
    title: 'Balanced Week',
    description: 'Moved at least three life areas forward this week.',
  },
  deep_work_day: {
    title: 'Deep Work Day',
    description: 'Logged 90 or more focus minutes in one day.',
  },
  goal_mover: {
    title: 'Goal Mover',
    description: 'Completed work connected to a goal.',
  },
};

const levelFromXp = (xp: number) => Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);

const dateDiff = (a: string, b: string) =>
  Math.round((new Date(`${a}T00:00:00.000Z`).getTime() - new Date(`${b}T00:00:00.000Z`).getTime()) / dayMs);

const defaultKey = (input: RewardEventInput, date: string) =>
  `${input.type}:${input.entityId ?? date}`;

async function getOrCreateProgress(userId: Types.ObjectId | string) {
  return UserProgress.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

export async function getProgressSnapshot(userId: Types.ObjectId | string) {
  const progress = await getOrCreateProgress(userId);
  return buildSnapshot(progress);
}

function buildQuestDefs(eventsToday: { type: RewardEventType; metadata?: Record<string, unknown> }[]) {
  const count = (type: RewardEventType) => eventsToday.filter((event) => event.type === type).length;
  const areaMoved = eventsToday.some((event) => Boolean(event.metadata?.lifeArea));
  return [
    { id: 'daily_start_1', label: 'Start your day', current: count('daily_start'), target: 1 },
    { id: 'tasks_3', label: 'Complete 3 tasks', current: count('task_completed'), target: 3 },
    { id: 'focus_1', label: 'Finish 1 focus sprint', current: count('focus_completed'), target: 1 },
    { id: 'habits_2', label: 'Check 2 habits', current: count('habit_checked'), target: 2 },
    { id: 'area_1', label: 'Move one life area forward', current: areaMoved ? 1 : 0, target: 1 },
    { id: 'shutdown_1', label: 'Close the day', current: count('evening_shutdown'), target: 1 },
  ];
}

function applyQuestBonuses(
  progress: Awaited<ReturnType<typeof getOrCreateProgress>>,
  date: string,
): { questBonuses: { questId: string; xp: number }[]; allQuestsComplete: boolean } {
  const eventsToday = progress.events.filter((event) => event.date === date);
  const quests = buildQuestDefs(eventsToday);
  const questBonuses: { questId: string; xp: number }[] = [];

  for (const quest of quests) {
    if (quest.current < quest.target) continue;
    const key = `quest_bonus:${quest.id}:${date}`;
    if (progress.eventKeys.includes(key)) continue;
    progress.totalXp += QUEST_BONUS_XP;
    progress.eventKeys.push(key);
    progress.events.unshift({
      key,
      type: 'quest_bonus',
      xp: QUEST_BONUS_XP,
      title: eventTitles.quest_bonus,
      description: quest.label,
      date,
      entityId: quest.id,
      metadata: { questId: quest.id },
      createdAt: new Date(),
    } as never);
    questBonuses.push({ questId: quest.id, xp: QUEST_BONUS_XP });
  }

  const allDone = quests.every((q) => q.current >= q.target);
  let allQuestsComplete = false;
  if (allDone) {
    const allKey = `daily_quests_complete:${date}`;
    if (!progress.eventKeys.includes(allKey)) {
      progress.totalXp += ALL_QUESTS_BONUS_XP;
      progress.eventKeys.push(allKey);
      progress.events.unshift({
        key: allKey,
        type: 'daily_quests_complete',
        xp: ALL_QUESTS_BONUS_XP,
        title: eventTitles.daily_quests_complete,
        description: 'Every quest finished today.',
        date,
        createdAt: new Date(),
      } as never);
      allQuestsComplete = true;
    }
  }

  progress.level = levelFromXp(progress.totalXp);
  progress.events = progress.events.slice(0, 250);
  return { questBonuses, allQuestsComplete };
}

export async function recordProgressEvent(input: RewardEventInput) {
  const date = input.date ?? ymd();
  const key = String(input.metadata?.key ?? defaultKey(input, date));
  const progress = await getOrCreateProgress(input.userId);
  const duplicate = progress.eventKeys.includes(key);
  const previousLevel = progress.level;
  const previousStreak = progress.dailyStreak;
  let streakFreezeUsed = false;
  let primaryXp = 0;

  if (!duplicate) {
    const xp = xpRules[input.type](input);
    primaryXp = xp;
    progress.totalXp += xp;
    progress.level = levelFromXp(progress.totalXp);
    progress.eventKeys.push(key);
    progress.events.unshift({
      key,
      type: input.type,
      xp,
      title: input.title ?? eventTitles[input.type],
      description: input.description,
      date,
      entityId: input.entityId,
      metadata: input.metadata,
      createdAt: new Date(),
    } as never);
    progress.events = progress.events.slice(0, 250);

    const last = progress.lastActivityDate;
    if (!last) {
      progress.dailyStreak = 1;
      const starterFreezeKey = `starter_freeze:${date}`;
      if (!progress.eventKeys.includes(starterFreezeKey) && input.type !== 'quest_bonus' && input.type !== 'daily_quests_complete') {
        progress.streakFreezes = Math.max(progress.streakFreezes, 1);
        progress.eventKeys.push(starterFreezeKey);
      }
    } else {
      const gap = dateDiff(date, last);
      if (gap === 1) progress.dailyStreak += 1;
      if (gap > 1) {
        if (progress.streakFreezes > 0) {
          progress.streakFreezes -= 1;
          streakFreezeUsed = true;
        } else {
          progress.dailyStreak = 1;
        }
      }
    }
    if (!last || date >= last) progress.lastActivityDate = date;
    progress.longestStreak = Math.max(progress.longestStreak, progress.dailyStreak);

    if (input.type === 'weekly_review') {
      progress.streakFreezes = Math.min(3, progress.streakFreezes + 1);
    }

    unlockAchievements(progress, input, date);
    await progress.save();
  }

  const { questBonuses, allQuestsComplete } = applyQuestBonuses(progress, date);
  if (questBonuses.length > 0 || allQuestsComplete) {
    await progress.save();
  }

  const snapshot = buildSnapshot(progress);
  const existingEvent = duplicate ? progress.events.find((event) => event.key === key) : undefined;
  const canReplayRecentAward = existingEvent
    ? Date.now() - new Date(existingEvent.createdAt).getTime() < 10000
    : false;
  return {
    ...snapshot,
    awarded: {
      duplicate,
      xp: duplicate && canReplayRecentAward ? existingEvent?.xp ?? 0 : duplicate ? 0 : primaryXp,
      levelBefore: previousLevel,
      levelAfter: progress.level,
      leveledUp: !duplicate && progress.level > previousLevel,
      streakBefore: previousStreak,
      streakAfter: progress.dailyStreak,
      streakFreezeUsed: !duplicate && streakFreezeUsed,
      achievementsUnlocked: duplicate ? [] : snapshot.achievements.filter((achievement) => {
        const unlockedAt = new Date(achievement.unlockedAt).getTime();
        return Date.now() - unlockedAt < 5000;
      }),
      questBonuses: questBonuses.length ? questBonuses : undefined,
      allQuestsComplete: allQuestsComplete || undefined,
    },
  };
}

function unlockAchievements(progress: Awaited<ReturnType<typeof getOrCreateProgress>>, input: RewardEventInput, date: string) {
  const unlocked = new Set(progress.achievements.map((achievement) => achievement.id));
  const unlock = (id: keyof typeof achievementDefinitions) => {
    if (unlocked.has(id)) return;
    const definition = achievementDefinitions[id];
    progress.achievements.push({ id, ...definition, unlockedAt: new Date() });
    unlocked.add(id);
  };

  if (input.type === 'focus_completed') unlock('first_focus');
  if (input.type === 'weekly_review') unlock('weekly_reset');
  if (input.type === 'habit_checked' && Number(input.metadata?.streak ?? 0) >= 7) unlock('habit_7_day_streak');
  if (input.metadata?.goalId) unlock('goal_mover');

  const todayFocus = progress.events
    .filter((event) => event.date === date && event.type === 'focus_completed')
    .reduce((total, event) => total + Number(event.metadata?.duration ?? 0), 0);
  if (todayFocus >= 90) unlock('deep_work_day');

  const weekStart = startOfWeek(date);
  const weekAreas = new Set(
    progress.events
      .filter((event) => event.date >= weekStart)
      .map((event) => event.metadata?.lifeArea)
      .filter(Boolean)
  );
  if (input.metadata?.lifeArea) weekAreas.add(input.metadata.lifeArea);
  if (weekAreas.size >= 3) unlock('balanced_week');
}

function startOfWeek(date: string) {
  const d = new Date(`${date}T00:00:00.000Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return ymd(d);
}

function buildSnapshot(progress: Awaited<ReturnType<typeof getOrCreateProgress>>) {
  const today = ymd();
  const eventsToday = progress.events.filter((event) => event.date === today);
  const questDefs = buildQuestDefs(eventsToday);
  const xpForCurrentLevel = Math.pow(progress.level - 1, 2) * 100;
  const xpForNextLevel = Math.pow(progress.level, 2) * 100;

  return {
    totalXp: progress.totalXp,
    level: progress.level,
    xpForCurrentLevel,
    xpForNextLevel,
    xpIntoLevel: progress.totalXp - xpForCurrentLevel,
    xpToNextLevel: Math.max(0, xpForNextLevel - progress.totalXp),
    dailyStreak: progress.dailyStreak,
    longestStreak: progress.longestStreak,
    lastActivityDate: progress.lastActivityDate,
    streakFreezes: progress.streakFreezes,
    quests: questDefs.map((quest) => ({
      ...quest,
      completed: quest.current >= quest.target,
    })),
    achievements: progress.achievements,
    recentEvents: progress.events.slice(0, 20),
  };
}
