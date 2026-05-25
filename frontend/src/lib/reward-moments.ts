import { toast } from 'sonner';
import type { UserProgress } from './types';
import { pickRewardQuote } from './motivational-quotes';
import {
  formatFirstXpElapsed,
  isUnderThreeMinuteTarget,
  recordFirstXpIfNeeded,
  clearFirstWinFlow,
} from './first-win';

const STREAK_MILESTONES = [3, 7, 14, 30];
const milestoneKey = (streak: number) => `lifeos_streak_milestone_${streak}`;

export type RewardMomentContext = {
  /** Primary action type for day-closed detection */
  eventType?: string;
  dailyStartDone?: boolean;
};

let levelUpHandler: ((level: number) => void) | null = null;

/** Register UI handler for level-up dialog (RewardMomentProvider). */
export function setLevelUpHandler(handler: ((level: number) => void) | null) {
  levelUpHandler = handler;
}

/**
 * Subtle reward feedback: one primary toast, optional level-up dialog, quest/streak extras.
 */
export function emitRewardMoment(progress?: UserProgress, context?: RewardMomentContext) {
  const award = progress?.awarded;
  if (!award) return;

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
    toast.success(`${m}-day streak`, {
      description: 'Consistency is compounding.',
      icon: '🔥',
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
    const quoteLine = Math.random() < 0.35 ? pickRewardQuote() : null;
    toast.success(`+${award.xp} XP`, {
      description: quoteLine
        ? `${quoteLine} · ${award.streakAfter} day streak`
        : `${award.streakAfter} day streak · ${progress!.xpToNextLevel} XP to level ${progress!.level + 1}`,
    });
  }

  award.questBonuses?.forEach(bonus => {
    toast.success('Quest complete', {
      description: `+${bonus.xp} XP`,
    });
  });

  if (award.allQuestsComplete) {
    toast.success('All daily quests done', {
      description: '+25 XP · You closed the loop today.',
    });
  }

  if (
    context?.eventType === 'evening_shutdown' &&
    (context.dailyStartDone ?? false)
  ) {
    toast.success('Day closed', {
      description: 'Morning start and evening shutdown complete — momentum loop at 100%.',
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
