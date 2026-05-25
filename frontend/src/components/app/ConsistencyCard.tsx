import { Flame, Activity, Target, Timer, TrendingUp } from 'lucide-react';
import { ConsistencyStats } from '@/lib/insights';
import { cn } from '@/lib/utils';

interface Props {
  stats: ConsistencyStats;
  /** Global engagement streak from progress (canonical). */
  dayStreak?: number;
  dailyLoopClosedToday?: boolean;
}

export function ConsistencyCard({ stats, dayStreak, dailyLoopClosedToday }: Props) {
  const items = [
    { label: 'Day streak', value: dayStreak ?? stats.checkInStreak, suffix: 'd', icon: Flame, color: 'text-warning' },
    { label: 'Weekly score', value: stats.weeklyScore, suffix: '%', icon: TrendingUp, color: 'text-primary' },
    { label: 'Best habit streak', value: stats.bestHabitStreak, suffix: 'd', icon: Activity, color: 'text-accent' },
    { label: 'Focus streak', value: stats.focusStreak, suffix: 'd', icon: Timer, color: 'text-success' },
    { label: 'Goal momentum', value: stats.goalMomentum, suffix: '%', icon: Target, color: 'text-info' },
  ];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="pointer-events-none absolute -right-14 -top-16 h-32 w-32 rounded-full bg-warning/10 blur-3xl" />
      <div className="relative flex items-center gap-2 mb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning ring-1 ring-warning/20">
          <Flame className="h-4 w-4" />
        </span>
        <h2 className="font-semibold text-foreground">Consistency</h2>
        <span className="text-xs text-muted-foreground ml-auto text-right">
          {dailyLoopClosedToday ? 'Daily loop closed today' : 'Last 7 days'}
        </span>
      </div>
      <div className="relative grid grid-cols-2 md:grid-cols-5 gap-3">
        {items.map(it => (
          <div key={it.label} className="rounded-lg bg-secondary/45 p-3 ring-1 ring-border/50">
            <it.icon className={cn('h-4 w-4 mb-2', it.color)} />
            <p className="text-xl font-bold text-foreground tabular-nums">
              {it.value}<span className="text-sm font-medium text-muted-foreground">{it.suffix}</span>
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{it.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
