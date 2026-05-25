import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Compass, Flame, Target, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LifeMomentum } from '@/lib/types';
import { getLifeArea } from '@/lib/life-areas';

interface LifeMomentumCardProps {
  momentum?: LifeMomentum;
  loading?: boolean;
}

const componentLabels: Record<keyof LifeMomentum['components'], string> = {
  tasks: 'Tasks',
  habits: 'Habits',
  focus: 'Focus',
  goals: 'Goals',
  checkIns: 'Check-ins',
  reviews: 'Reviews',
  dailyLoop: 'Daily loop',
};

export function LifeMomentumCard({ momentum, loading }: LifeMomentumCardProps) {
  if (loading || !momentum) {
    return (
      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="h-5 w-40 rounded bg-secondary animate-pulse" />
        <div className="mt-5 h-28 rounded-lg bg-secondary/70 animate-pulse" />
      </section>
    );
  }

  const topComponents = Object.entries(momentum.components)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3) as [keyof LifeMomentum['components'], number][];
  const activeAreas = momentum.areas.filter(area => area.status === 'active').slice(0, 3);
  const watchAreas = momentum.areas.filter(area => area.status !== 'active').slice(0, 3);

  return (
    <section className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="p-5 border-b border-subtle flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-lg gradient-primary text-primary-foreground flex items-center justify-center shadow-glow">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-h3 text-foreground">Life Momentum</h2>
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">{momentum.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              A 30-day signal from tasks, habits, focus, goals, reviews, and your daily planning loop.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-4xl font-semibold text-foreground tabular-nums leading-none">{momentum.score}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">score</p>
          </div>
          <div className="w-28">
            <Progress value={momentum.score} className="h-2" />
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            Weakest Signals
          </div>
          <div className="space-y-3">
            {topComponents.map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between gap-3 text-xs mb-1">
                  <span className="text-muted-foreground">{componentLabels[key]}</span>
                  <span className="text-foreground font-medium tabular-nums">{value}%</span>
                </div>
                <Progress value={value} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Compass className="h-4 w-4 text-info" />
            Life Area Balance
          </div>
          {momentum.areas.length === 0 ? (
            <p className="text-xs text-muted-foreground">Add life areas to tasks, habits, goals, or notes to see balance.</p>
          ) : (
            <div className="space-y-2">
              {[...watchAreas, ...activeAreas].slice(0, 4).map(area => {
                const meta = getLifeArea(area.area);
                const Icon = meta?.icon ?? Target;
                return (
                  <div key={area.area} className="flex items-center justify-between gap-3 rounded-lg surface-sunken px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${meta?.color ?? 'text-primary'}`} />
                      <span className="text-xs font-medium text-foreground truncate">{area.label}</span>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                      area.status === 'neglected' ? 'text-destructive' : area.status === 'watch' ? 'text-warning' : 'text-success'
                    }`}>
                      {area.status === 'active' ? `${area.activityCount} moves` : `${area.daysSinceActivity ?? 0}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Next Best Moves
          </div>
          <div className="space-y-2">
            {momentum.warnings.length > 0 && (
              <div className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-2">
                <p className="text-xs text-foreground">{momentum.warnings[0].message}</p>
              </div>
            )}
            {momentum.suggestions.slice(0, 2).map(suggestion => (
              <Link
                key={`${suggestion.route}-${suggestion.title}`}
                to={suggestion.route}
                className="group flex items-start justify-between gap-3 rounded-lg surface-sunken px-3 py-2 hover:bg-secondary transition-colors"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-foreground">{suggestion.title}</span>
                  <span className="block text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{suggestion.description}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-secondary/35 border-t border-subtle flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {momentum.today.dailyStartDone ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Circle className="h-3.5 w-3.5" />}
          Daily Start
        </span>
        <span className="flex items-center gap-1.5">
          {momentum.today.eveningShutdownDone ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Circle className="h-3.5 w-3.5" />}
          Evening Shutdown
        </span>
        <span>{momentum.week.tasksCompleted} tasks done</span>
        <span>{Math.round(momentum.week.focusMinutes / 60 * 10) / 10}h focus</span>
        <span>{momentum.week.habitConsistency}% habits</span>
      </div>
    </section>
  );
}
