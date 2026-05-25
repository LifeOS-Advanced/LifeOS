import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowRight, Flame } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-xl border border-warning/25 bg-gradient-to-r from-warning/10 via-card to-card px-4 py-3 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="pointer-events-none absolute -left-10 top-0 h-20 w-20 rounded-full bg-warning/15 blur-2xl" />
      <div className="relative flex items-center gap-2 text-sm text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning ring-1 ring-warning/20">
          <Flame className="h-4 w-4 shrink-0" />
        </span>
        <span>
          Keep your <strong>{progress?.dailyStreak}-day</strong> streak - one action today.
        </span>
      </div>
      {easiest && (
        <Link
          to={questRoute(easiest)}
          className="relative inline-flex items-center gap-1 rounded-lg bg-card px-3 py-1.5 text-xs font-medium text-primary ring-1 ring-border hover:bg-secondary shrink-0"
        >
          {easiest.label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
