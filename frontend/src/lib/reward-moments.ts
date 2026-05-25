import {
  showRewardToast,
  type RewardToastIntensity,
  type RewardToastVariant,
} from './reward-toast';
import type { LifeArea, RewardEventType, UserProfile, UserProgress } from './types';
import { pickRewardQuote } from './motivational-quotes';
import {
  formatFirstXpElapsed,
  isUnderThreeMinuteTarget,
  recordFirstXpIfNeeded,
  clearFirstWinFlow,
} from './first-win';
import { trackLoopEvent } from './analytics';
import { buildIdentityMessage, buildWhyThisMatters } from './identity';
import { getRewardSoundKind, playRewardSound } from './reward-sounds';

const STREAK_MILESTONES = [3, 7, 14, 30];
const milestoneKey = (streak: number) => `lifeos_streak_milestone_${streak}`;
const closureKey = (date: string) => `lifeos_daily_closure_moment_${date}`;

export type RewardMomentContext = {
  /** Primary action type for day-closed detection */
  eventType?: RewardEventType | string;
  dailyStartDone?: boolean;
  profile?: UserProfile | null;
  goalTitle?: string;
  lifeArea?: LifeArea | string;
  mainPriority?: string;
  date?: string;
  evidenceLabel?: string;
  intensity?: RewardToastIntensity;
  variant?: RewardToastVariant;
  tomorrowFirstTask?: string;
};

export type LevelUpMoment = {
  level: number;
  xpToNextLevel?: number;
  totalXp?: number;
};

export type DailyClosureMoment = {
  date: string;
  questsDone: number;
  questsTotal: number;
  streak: number;
  xpToday?: number;
  tomorrowFirstTask?: string;
};

let levelUpHandler: ((moment: LevelUpMoment) => void) | null = null;
let dailyClosureHandler: ((moment: DailyClosureMoment) => void) | null = null;

/** Register UI handler for level-up dialog (RewardMomentProvider). */
export function setLevelUpHandler(handler: ((moment: LevelUpMoment) => void) | null) {
  levelUpHandler = handler;
}

export function setDailyClosureHandler(handler: ((moment: DailyClosureMoment) => void) | null) {
  dailyClosureHandler = handler;
}

function intensityForEvent(eventType?: string): RewardToastIntensity {
  if (
    eventType === 'focus_completed' ||
    eventType === 'daily_start' ||
    eventType === 'evening_shutdown' ||
    eventType === 'weekly_review'
  ) {
    return 'medium';
  }
  return 'low';
}

function variantForEvent(eventType?: string): RewardToastVariant {
  if (eventType === 'focus_completed') return 'focus';
  if (
    eventType === 'daily_start' ||
    eventType === 'evening_shutdown' ||
    eventType === 'weekly_review'
  ) {
    return 'loop';
  }
  if (eventType === 'quest_bonus') return 'quest';
  return 'xp';
}

function questBonusXp(progress: UserProgress): number {
  return progress.awarded?.questBonuses?.reduce((sum, bonus) => sum + Math.max(0, bonus.xp), 0) ?? 0;
}

function todayKey() {
  return new Date().toLocaleDateString('en-CA');
}

function xpForDate(progress: UserProgress, date: string): number | undefined {
  const xp = progress.recentEvents
    .filter(event => event.date === date)
    .reduce((sum, event) => sum + Math.max(0, event.xp ?? 0), 0);
  return xp > 0 ? xp : undefined;
}

export function claimDailyClosureMoment(date: string): boolean {
  const key = closureKey(date);
  if (localStorage.getItem(key)) return false;
  localStorage.setItem(key, '1');
  return true;
}

function soundEnabled(profile?: UserProfile | null): boolean {
  return Boolean(profile?.preferences?.sensory?.rewardSounds);
}

function soundVolume(profile?: UserProfile | null): number {
  return profile?.preferences?.sensory?.soundVolume ?? 0.35;
}

/**
 * Premium reward feedback: visual polish for meaningful work, with XP secondary.
 */
export function emitRewardMoment(progress?: UserProgress, context?: RewardMomentContext) {
  const award = progress?.awarded;
  if (!award || !progress) return;
  let queuedSound: ReturnType<typeof getRewardSoundKind> = null;
  let queuedSoundPriority = 0;
  const queueSound = (kind: ReturnType<typeof getRewardSoundKind>, priority: number) => {
    if (!kind || priority < queuedSoundPriority) return;
    queuedSound = kind;
    queuedSoundPriority = priority;
  };

  if (context?.eventType === 'daily_start') trackLoopEvent('daily_start_completed');
  if (context?.eventType === 'evening_shutdown') trackLoopEvent('evening_shutdown_completed');
  if (context?.eventType === 'weekly_review') trackLoopEvent('weekly_review_completed');

  if (award.streakFreezeUsed && award.streakAfter > 0) {
    showRewardToast({
      title: 'Streak freeze used',
      description: `Your ${award.streakAfter}-day streak stayed intact.`,
      intensity: 'medium',
      variant: 'freeze',
    });
  }

  const milestones = STREAK_MILESTONES.filter(
    m => award.streakAfter >= m && award.streakBefore < m,
  );
  for (const m of milestones) {
    if (localStorage.getItem(milestoneKey(m))) continue;
    localStorage.setItem(milestoneKey(m), '1');
    showRewardToast({
      title: `For ${m} days, you've shown up.`,
      description: `${m} recorded days in a row.`,
      intensity: 'high',
      variant: 'streak',
    });
    queueSound(getRewardSoundKind({ streakMilestone: true }), 4);
  }

  const xpEarned =
    (award.xp > 0 && !award.duplicate) ||
    (award.questBonuses?.some(b => b.xp > 0) ?? false);

  const firstXpResult = xpEarned
    ? recordFirstXpIfNeeded()
    : { firstXp: false as const, elapsedMs: null as number | null };

  if (firstXpResult.firstXp) {
    clearFirstWinFlow();
    trackLoopEvent('first_xp_earned', {
      elapsedMs: firstXpResult.elapsedMs,
      onTarget: isUnderThreeMinuteTarget(firstXpResult.elapsedMs),
      eventType: context?.eventType,
    });
    const elapsed = formatFirstXpElapsed(firstXpResult.elapsedMs);
    const onTarget = isUnderThreeMinuteTarget(firstXpResult.elapsedMs);
    showRewardToast({
      title: 'First XP earned',
      description: onTarget
        ? `You did it in ${elapsed}, under 3 minutes.`
        : `Your first win took ${elapsed}. Keep the loop going.`,
      xp: award.xp > 0 ? award.xp : questBonusXp(progress),
      intensity: 'high',
      variant: 'level',
    });
    queueSound(getRewardSoundKind({ variant: 'level', intensity: 'high' }), 4);
  }

  if (award.leveledUp && award.levelAfter > award.levelBefore) {
    levelUpHandler?.({
      level: award.levelAfter,
      xpToNextLevel: progress.xpToNextLevel,
      totalXp: progress.totalXp,
    });
    queueSound(getRewardSoundKind({ leveledUp: true }), 4);
  } else if (award.xp > 0 && !award.duplicate && !firstXpResult.firstXp) {
    const resolvedIntensity = context?.intensity ?? intensityForEvent(context?.eventType);
    const resolvedVariant = context?.variant ?? variantForEvent(context?.eventType);
    const quoteLine = Math.random() < 0.15 ? pickRewardQuote() : null;
    const why = buildWhyThisMatters({
      type: context?.eventType,
      profile: context?.profile,
      goalTitle: context?.goalTitle,
      lifeArea: context?.lifeArea,
      mainPriority: context?.mainPriority,
      dailyStartDone: context?.dailyStartDone,
    });
    showRewardToast({
      title: buildIdentityMessage(context?.eventType),
      description: context?.evidenceLabel ?? why ?? quoteLine ?? undefined,
      xp: award.xp,
      intensity: resolvedIntensity,
      variant: resolvedVariant,
    });
    queueSound(getRewardSoundKind({
      eventType: context?.eventType,
      intensity: resolvedIntensity,
      variant: resolvedVariant,
    }), resolvedIntensity === 'high' ? 3 : resolvedIntensity === 'medium' ? 2 : 1);
  }

  award.questBonuses?.forEach(bonus => {
    trackLoopEvent('quest_completed', { questId: bonus.questId, xp: bonus.xp });
    showRewardToast({
      title: 'Quest complete',
      description: "This made today's loop more complete.",
      xp: bonus.xp,
      intensity: 'medium',
      variant: 'quest',
    });
    queueSound(getRewardSoundKind({ eventType: 'quest_bonus', variant: 'quest', intensity: 'medium' }), 2);
  });

  if (award.allQuestsComplete) {
    trackLoopEvent('all_daily_quests_completed');
    showRewardToast({
      title: 'All daily quests done',
      description: 'You closed the loop today.',
      xp: 25,
      intensity: 'high',
      variant: 'loop',
    });
    queueSound(getRewardSoundKind({ allQuestsComplete: true, variant: 'loop', intensity: 'high' }), 3);
  }

  const dailyLoopClosed =
    context?.eventType === 'evening_shutdown' &&
    (context.dailyStartDone ?? false);

  if (dailyLoopClosed) {
    trackLoopEvent('daily_loop_closed');
    const date = context.date ?? progress.lastActivityDate ?? todayKey();
    if (claimDailyClosureMoment(date)) {
      showRewardToast({
        title: 'Day closed',
        description: 'Daily Start, meaningful work, and Evening Shutdown are complete.',
        intensity: 'high',
        variant: 'loop',
      });
      dailyClosureHandler?.({
        date,
        questsDone: progress.quests.filter(quest => quest.completed).length,
        questsTotal: progress.quests.length,
        streak: progress.dailyStreak,
        xpToday: xpForDate(progress, date),
        tomorrowFirstTask: context.tomorrowFirstTask,
      });
      queueSound(getRewardSoundKind({ dailyLoopClosed: true, variant: 'loop', intensity: 'high' }), 4);
    }
  }

  award.achievementsUnlocked.forEach(achievement => {
    showRewardToast({
      title: achievement.title,
      description: achievement.description,
      intensity: 'high',
      variant: 'achievement',
    });
    queueSound(getRewardSoundKind({ variant: 'achievement', intensity: 'high' }), 4);
  });

  void playRewardSound(queuedSound, soundVolume(context?.profile), soundEnabled(context?.profile));
}

/** @deprecated Use emitRewardMoment */
export function showRewardFeedback(progress?: UserProgress, context?: RewardMomentContext) {
  emitRewardMoment(progress, context);
}
