import { Task, Habit, Goal } from '@/lib/types';
import { TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';

interface Props {
  goal: Goal;
  linkedTasks: Task[];
  linkedHabits: Habit[];
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function GoalIntelligence({ goal, linkedTasks, linkedHabits }: Props) {
  const today = new Date();
  const created = new Date(goal.createdAt);
  const target = goal.targetDate ? new Date(goal.targetDate) : null;

  const daysIn = Math.max(1, daysBetween(created, today));
  const daysLeft = target ? daysBetween(today, target) : null;
  const totalDays = target ? Math.max(1, daysBetween(created, target)) : null;
  const expected = totalDays ? Math.min(100, Math.round((daysIn / totalDays) * 100)) : null;
  const onTrack = expected == null ? null : goal.progress >= expected - 5;

  // Momentum: tasks completed in last 14 days vs prior 14
  const ms = 86_400_000;
  const completedRecent = linkedTasks.filter(t => t.status === 'done' && t.dueDate && new Date(t.dueDate).getTime() > today.getTime() - 14 * ms).length;
  const completedPrior = linkedTasks.filter(t => t.status === 'done' && t.dueDate && new Date(t.dueDate).getTime() <= today.getTime() - 14 * ms && new Date(t.dueDate).getTime() > today.getTime() - 28 * ms).length;
  const momentum = completedRecent - completedPrior;

  // Habit consistency in last 14 days
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  const habitHits = linkedHabits.reduce((acc, h) => acc + last14.filter(d => h.completedDates.includes(d)).length, 0);
  const habitMax = linkedHabits.length * 14;
  const consistency = habitMax ? Math.round((habitHits / habitMax) * 100) : null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
      <Stat
        icon={Calendar}
        label={target ? 'Time' : 'Age'}
        value={target ? (daysLeft! >= 0 ? `${daysLeft}d left` : `${-daysLeft!}d over`) : `${daysIn}d`}
        tone={target && daysLeft! < 0 ? 'destructive' : 'default'}
      />
      {expected != null && (
        <Stat
          icon={onTrack ? TrendingUp : TrendingDown}
          label="Pace"
          value={onTrack ? 'On track' : 'Behind'}
          hint={`Expected ${expected}%`}
          tone={onTrack ? 'success' : 'warning'}
        />
      )}
      <Stat
        icon={momentum >= 0 ? TrendingUp : TrendingDown}
        label="Momentum"
        value={`${momentum >= 0 ? '+' : ''}${momentum} tasks`}
        hint="vs prior 2w"
        tone={momentum > 0 ? 'success' : momentum < 0 ? 'warning' : 'default'}
      />
      {consistency != null && (
        <Stat
          icon={Activity}
          label="Habit consistency"
          value={`${consistency}%`}
          hint="last 14 days"
          tone={consistency >= 70 ? 'success' : consistency >= 40 ? 'warning' : 'destructive'}
        />
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, tone = 'default' }: { icon: any; label: string; value: string; hint?: string; tone?: 'default' | 'success' | 'warning' | 'destructive' }) {
  const toneClass = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  }[tone];
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Icon className="h-3 w-3" />{label}
      </div>
      <div className={`text-sm font-semibold ${toneClass}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}
