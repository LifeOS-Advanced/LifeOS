import type { Achievement, RewardEvent, RewardEventInput, RewardEventType, UserProgress } from './types';

const STORAGE_KEY = 'lifeos_progress';
const dayMs = 24 * 60 * 60 * 1000;
const QUEST_BONUS_XP = 5;
const ALL_QUESTS_BONUS_XP = 25;

interface StoredProgress {
  totalXp: number;
  level: number;
  dailyStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  streakFreezes: number;
  eventKeys: string[];
  events: RewardEvent[];
  achievements: Achievement[];
}

const ymd = (date = new Date()) => date.toISOString().split('T')[0];

const xpRules: Record<RewardEventType, (input: RewardEventInput) => number> = {
  task_completed: () => 20,
  habit_checked: () => 15,
  focus_completed: (input) => Math.max(20, Math.min(120, Number(input.metadata?.duration ?? 25))),
  daily_start: () => 25,
  evening_shutdown: () => 30,
  weekly_review: () => 75,
  quest_bonus: () => QUEST_BONUS_XP,
  daily_quests_complete: () => ALL_QUESTS_BONUS_XP,
};

const eventTitles: Record<RewardEventType, string> = {
  task_completed: 'Task completed',
  habit_checked: 'Habit checked',
  focus_completed: 'Focus sprint finished',
  daily_start: 'Daily Start completed',
  evening_shutdown: 'Evening Shutdown completed',
  weekly_review: 'Weekly Reset completed',
  quest_bonus: 'Daily quest done',
  daily_quests_complete: 'All daily quests complete',
};

const achievements = {
  first_focus: { title: 'First Focus Session', description: 'Finished your first saved focus sprint.' },
  habit_7_day_streak: { title: '7-Day Habit Streak', description: 'Kept a habit alive for seven days.' },
  weekly_reset: { title: 'Weekly Reset Completed', description: 'Closed a week with a review.' },
  balanced_week: { title: 'Balanced Week', description: 'Moved at least three life areas forward this week.' },
  deep_work_day: { title: 'Deep Work Day', description: 'Logged 90 or more focus minutes in one day.' },
  goal_mover: { title: 'Goal Mover', description: 'Completed work connected to a goal.' },
};

const defaultProgress = (): StoredProgress => ({
  totalXp: 0,
  level: 1,
  dailyStreak: 0,
  longestStreak: 0,
  streakFreezes: 0,
  eventKeys: [],
  events: [],
  achievements: [],
});

function readProgress(): StoredProgress {
  try {
    return { ...defaultProgress(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
  } catch {
    return defaultProgress();
  }
}

function writeProgress(progress: StoredProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

const levelFromXp = (xp: number) => Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
const eventKey = (input: RewardEventInput, date: string) => String(input.metadata?.key ?? `${input.type}:${input.entityId ?? date}`);
const dateDiff = (a: string, b: string) =>
  Math.round((new Date(`${a}T00:00:00.000Z`).getTime() - new Date(`${b}T00:00:00.000Z`).getTime()) / dayMs);

const startOfWeek = (date: string) => {
  const d = new Date(`${date}T00:00:00.000Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return ymd(d);
};

function buildQuestDefs(eventsToday: RewardEvent[]) {
  const count = (type: RewardEventType) => eventsToday.filter(event => event.type === type).length;
  const areaMoved = eventsToday.some(event => Boolean(event.metadata?.lifeArea));
  return [
    { id: 'daily_start_1', label: 'Start your day', current: count('daily_start'), target: 1 },
    { id: 'tasks_3', label: 'Complete 3 tasks', current: count('task_completed'), target: 3 },
    { id: 'focus_1', label: 'Finish 1 focus sprint', current: count('focus_completed'), target: 1 },
    { id: 'habits_2', label: 'Check 2 habits', current: count('habit_checked'), target: 2 },
    { id: 'area_1', label: 'Move one life area forward', current: areaMoved ? 1 : 0, target: 1 },
    { id: 'shutdown_1', label: 'Close the day', current: count('evening_shutdown'), target: 1 },
  ];
}

function applyQuestBonuses(progress: StoredProgress, date: string) {
  const eventsToday = progress.events.filter(event => event.date === date);
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
      createdAt: new Date().toISOString(),
    });
    questBonuses.push({ questId: quest.id, xp: QUEST_BONUS_XP });
  }

  const allDone = quests.every(q => q.current >= q.target);
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
        createdAt: new Date().toISOString(),
      });
      allQuestsComplete = true;
    }
  }

  progress.level = levelFromXp(progress.totalXp);
  progress.events = progress.events.slice(0, 250);
  return { questBonuses, allQuestsComplete };
}

export function getLocalProgress(): UserProgress {
  return buildSnapshot(readProgress());
}

export function recordLocalProgressEvent(input: RewardEventInput): UserProgress {
  const progress = readProgress();
  const date = input.date ?? ymd();
  const key = eventKey(input, date);
  const previousLevel = progress.level;
  const previousStreak = progress.dailyStreak;
  let streakFreezeUsed = false;

  if (progress.eventKeys.includes(key)) {
    const { questBonuses, allQuestsComplete } = applyQuestBonuses(progress, date);
    if (questBonuses.length > 0 || allQuestsComplete) writeProgress(progress);
    return {
      ...buildSnapshot(progress),
      awarded: {
        ...emptyAward(previousLevel, previousStreak, true),
        questBonuses: questBonuses.length ? questBonuses : undefined,
        allQuestsComplete: allQuestsComplete || undefined,
      },
    };
  }

  const xp = xpRules[input.type](input);
  const event: RewardEvent = {
    key,
    type: input.type,
    xp,
    title: input.title ?? eventTitles[input.type],
    description: input.description,
    date,
    entityId: input.entityId,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  };

  progress.totalXp += xp;
  progress.level = levelFromXp(progress.totalXp);
  progress.eventKeys.push(key);
  progress.events = [event, ...progress.events].slice(0, 250);

  const last = progress.lastActivityDate;
  if (!last) progress.dailyStreak = 1;
  else {
    const gap = dateDiff(date, last);
    if (gap === 1) progress.dailyStreak += 1;
    if (gap > 1) {
      if (progress.streakFreezes > 0) {
        progress.streakFreezes -= 1;
        streakFreezeUsed = true;
      } else progress.dailyStreak = 1;
    }
  }
  if (!last || date >= last) progress.lastActivityDate = date;
  progress.longestStreak = Math.max(progress.longestStreak, progress.dailyStreak);
  if (input.type === 'weekly_review') progress.streakFreezes = Math.min(3, progress.streakFreezes + 1);

  const unlocked = unlockAchievements(progress, input, date);
  const { questBonuses, allQuestsComplete } = applyQuestBonuses(progress, date);
  writeProgress(progress);

  return {
    ...buildSnapshot(progress),
    awarded: {
      duplicate: false,
      xp,
      levelBefore: previousLevel,
      levelAfter: progress.level,
      leveledUp: progress.level > previousLevel,
      streakBefore: previousStreak,
      streakAfter: progress.dailyStreak,
      streakFreezeUsed,
      achievementsUnlocked: unlocked,
      questBonuses: questBonuses.length ? questBonuses : undefined,
      allQuestsComplete: allQuestsComplete || undefined,
    },
  };
}

function emptyAward(level: number, streak: number, duplicate: boolean) {
  return {
    duplicate,
    xp: 0,
    levelBefore: level,
    levelAfter: level,
    leveledUp: false,
    streakBefore: streak,
    streakAfter: streak,
    achievementsUnlocked: [] as Achievement[],
  };
}

function unlockAchievements(progress: StoredProgress, input: RewardEventInput, date: string) {
  const unlocked: Achievement[] = [];
  const ids = new Set(progress.achievements.map(achievement => achievement.id));
  const unlock = (id: keyof typeof achievements) => {
    if (ids.has(id)) return;
    const achievement = { id, ...achievements[id], unlockedAt: new Date().toISOString() };
    progress.achievements.push(achievement);
    ids.add(id);
    unlocked.push(achievement);
  };

  if (input.type === 'focus_completed') unlock('first_focus');
  if (input.type === 'weekly_review') unlock('weekly_reset');
  if (input.type === 'habit_checked' && Number(input.metadata?.streak ?? 0) >= 7) unlock('habit_7_day_streak');
  if (input.metadata?.goalId) unlock('goal_mover');

  const todayFocus = progress.events
    .filter(event => event.date === date && event.type === 'focus_completed')
    .reduce((total, event) => total + Number(event.metadata?.duration ?? 0), 0);
  if (todayFocus >= 90) unlock('deep_work_day');

  const weekStart = startOfWeek(date);
  const weekAreas = new Set(progress.events.filter(event => event.date >= weekStart).map(event => event.metadata?.lifeArea).filter(Boolean));
  if (weekAreas.size >= 3) unlock('balanced_week');

  return unlocked;
}

function buildSnapshot(progress: StoredProgress): UserProgress {
  const today = ymd();
  const todayEvents = progress.events.filter(event => event.date === today);
  const quests = buildQuestDefs(todayEvents).map(quest => ({
    ...quest,
    completed: quest.current >= quest.target,
  }));
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
    quests,
    achievements: progress.achievements,
    recentEvents: progress.events.slice(0, 20),
  };
}
