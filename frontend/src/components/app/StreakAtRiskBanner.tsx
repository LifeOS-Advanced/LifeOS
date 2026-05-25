import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import type { UserProgress } from '@/lib/types';
import { isStreakAtRisk } from '@/lib/daily-loop';

interface StreakAtRiskBannerProps {
  progress?: UserProgress;
  timezone: string;
}

export function StreakAtRiskBanner({ progress, timezone }: StreakAtRiskBannerProps) {
  if (!isStreakAtRisk(progress, timezone)) return null;

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
          to={easiest.id === 'daily_start_1' ? '/app/daily-start' : easiest.id === 'habits_2' ? '/app/habits' : '/app/tasks'}
          className="text-xs font-medium text-primary hover:underline shrink-0"
        >
          {easiest.label} →
        </Link>
      )}
    </div>
  );
}
