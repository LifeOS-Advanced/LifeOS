import { Flame, Activity, Target, Timer, TrendingUp } from 'lucide-react';
import { ConsistencyStats } from '@/lib/insights';

interface Props {
  stats: ConsistencyStats;
}

export function ConsistencyCard({ stats }: Props) {
  const items = [
    { label: 'Check-in streak', value: stats.checkInStreak, suffix: 'd', icon: Flame, color: 'text-warning' },
    { label: 'Weekly score', value: stats.weeklyScore, suffix: '%', icon: TrendingUp, color: 'text-primary' },
    { label: 'Best habit streak', value: stats.bestHabitStreak, suffix: 'd', icon: Activity, color: 'text-accent' },
    { label: 'Focus streak', value: stats.focusStreak, suffix: 'd', icon: Timer, color: 'text-success' },
    { label: 'Goal momentum', value: stats.goalMomentum, suffix: '%', icon: Target, color: 'text-info' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-4 w-4 text-warning" />
        <h2 className="font-semibold text-foreground">Consistency</h2>
        <span className="text-xs text-muted-foreground ml-auto">Last 7 days</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {items.map(it => (
          <div key={it.label} className="rounded-lg bg-secondary/40 p-3">
            <it.icon className={`h-4 w-4 ${it.color} mb-2`} />
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
