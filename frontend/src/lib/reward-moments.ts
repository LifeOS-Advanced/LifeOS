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

const STREAK_MILESTONES = [3, 7, 14, 30];
const milestoneKey = (streak: number) => `lifeos_streak_milestone_${streak}`;

export type RewardMomentContext = {
  /** Primary action type for day-closed detection */
  eventType?: RewardEventType | string;
  dailyStartDone?: boolean;
  profile?: UserProfile | null;
  goalTitle?: string;
  lifeArea?: LifeArea | string;
  mainPriority?: string;
  evidenceLabel?: string;
  intensity?: RewardToastIntensity;
  variant?: RewardToastVariant;
};

export type LevelUpMoment = {
  level: number;
  xpToNextLevel?: number;
  totalXp?: number;
};

let levelUpHandler: ((moment: LevelUpMoment) => void) | null = null;

/** Register UI handler for level-up dialog (RewardMomentProvider). */
export function setLevelUpHandler(handler: ((moment: LevelUpMoment) => void) | null) {
  levelUpHandler = handler;
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

/**
 * Premium reward feedback: visual polish for meaningful work, with XP secondary.
 */
export function emitRewardMoment(progress?: UserProgress, context?: RewardMomentContext) {
  const award = progress?.awarded;
  if (!award || !progress) return;

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
  }

  if (award.leveledUp && award.levelAfter > award.levelBefore) {
    levelUpHandler?.({
      level: award.levelAfter,
      xpToNextLevel: progress.xpToNextLevel,
      totalXp: progress.totalXp,
    });
  } else if (award.xp > 0 && !award.duplicate && !firstXpResult.firstXp) {
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
      intensity: context?.intensity ?? intensityForEvent(context?.eventType),
      variant: context?.variant ?? variantForEvent(context?.eventType),
    });
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
  }

  if (
    context?.eventType === 'evening_shutdown' &&
    (context.dailyStartDone ?? false)
  ) {
    trackLoopEvent('daily_loop_closed');
    showRewardToast({
      title: 'Day closed',
      description: 'Daily Start, meaningful work, and Evening Shutdown are complete.',
      intensity: 'high',
      variant: 'loop',
    });
  }

  award.achievementsUnlocked.forEach(achievement => {
    showRewardToast({
      title: achievement.title,
      description: achievement.description,
      intensity: 'high',
      variant: 'achievement',
    });
  });
}

/** @deprecated Use emitRewardMoment */
export function showRewardFeedback(progress?: UserProgress, context?: RewardMomentContext) {
  emitRewardMoment(progress, context);
}
