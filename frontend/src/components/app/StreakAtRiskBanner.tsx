import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Flame } from 'lucide-react';
import type { UserProgress } from '@/lib/types';
import { isStreakAtRisk, questRoute } from '@/lib/daily-loop';
import { trackLoopEventOnce } from '@/lib/analytics';

interface StreakAtRiskBannerProps {
  progress?: UserProgress;
  timezone: string;
}

export function StreakAtRiskBanner({ progress, timezone }: StreakAtRiskBannerProps) {
  const atRisk = isStreakAtRisk(progress, timezone);

  useEffect(() => {
    if (!atRisk) return;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    trackLoopEventOnce(`streak_at_risk_${today}`, 'streak_at_risk_shown', {
      streak: progress?.dailyStreak,
      freezes: progress?.streakFreezes,
    });
  }, [atRisk, progress?.dailyStreak, progress?.streakFreezes, timezone]);

  if (!atRisk) return null;

  const easiest = progress?.quests.find(q => !q.completed && (q.id === 'habits_2' || q.id === 'daily_start_1'))
    ?? progress?.quests.find(q => !q.completed);

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Flame className="h-4 w-4 text-warning shrink-0" />
        <span>
          Keep your <strong>{progress?.dailyStreak}-day</strong> streak — one action today.
        </span>
      </div>
      {easiest && (
        <Link
          to={questRoute(easiest)}
          className="text-xs font-medium text-primary hover:underline shrink-0"
        >
          {easiest.label} →
        </Link>
      )}
    </div>
  );
}
