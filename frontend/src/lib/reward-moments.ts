import { toast } from 'sonner';
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
};

let levelUpHandler: ((level: number) => void) | null = null;

/** Register UI handler for level-up dialog (RewardMomentProvider). */
export function setLevelUpHandler(handler: ((level: number) => void) | null) {
  levelUpHandler = handler;
}

/**
 * Subtle reward feedback: identity first, XP second, only for meaningful work.
 */
export function emitRewardMoment(progress?: UserProgress, context?: RewardMomentContext) {
  const award = progress?.awarded;
  if (!award) return;

  if (context?.eventType === 'daily_start') trackLoopEvent('daily_start_completed');
  if (context?.eventType === 'evening_shutdown') trackLoopEvent('evening_shutdown_completed');
  if (context?.eventType === 'weekly_review') trackLoopEvent('weekly_review_completed');

  if (award.streakFreezeUsed && award.streakAfter > 0) {
    toast('Streak freeze used', {
      description: `Your ${award.streakAfter}-day streak is still alive.`,
    });
  }

  const milestones = STREAK_MILESTONES.filter(
    m => award.streakAfter >= m && award.streakBefore < m,
  );
  for (const m of milestones) {
    if (localStorage.getItem(milestoneKey(m))) continue;
    localStorage.setItem(milestoneKey(m), '1');
    toast.success(`For ${m} days, you’ve shown up.`, {
      description: `${m} recorded days in a row.`,
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
    toast.success('First XP earned', {
      description: onTarget
        ? `You did it in ${elapsed} — under 3 minutes.`
        : `Your first win took ${elapsed}. Keep the loop going.`,
    });
  }

  if (award.leveledUp && award.levelAfter > award.levelBefore) {
    levelUpHandler?.(award.levelAfter);
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
    toast.success(buildIdentityMessage(context?.eventType), {
      description: context?.evidenceLabel
        ? `+${award.xp} XP · ${context.evidenceLabel}`
        : why
          ? `+${award.xp} XP · ${why}`
          : quoteLine
            ? `+${award.xp} XP · ${quoteLine}`
            : `+${award.xp} XP`,
    });
  }

  award.questBonuses?.forEach(bonus => {
    trackLoopEvent('quest_completed', { questId: bonus.questId, xp: bonus.xp });
    toast.success('Quest complete', {
      description: `+${bonus.xp} XP · This made today’s loop more complete.`,
    });
  });

  if (award.allQuestsComplete) {
    trackLoopEvent('all_daily_quests_completed');
    toast.success('All daily quests done', {
      description: '+25 XP · You closed the loop today.',
    });
  }

  if (
    context?.eventType === 'evening_shutdown' &&
    (context.dailyStartDone ?? false)
  ) {
    trackLoopEvent('daily_loop_closed');
    toast.success('Day closed', {
      description: 'Daily Start, meaningful work, and Evening Shutdown are complete.',
    });
  }

  award.achievementsUnlocked.forEach(achievement => {
    toast.success(achievement.title, {
      description: achievement.description,
    });
  });
}

/** @deprecated Use emitRewardMoment */
export function showRewardFeedback(progress?: UserProgress, context?: RewardMomentContext) {
  emitRewardMoment(progress, context);
}
