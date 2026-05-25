import { BookOpen, CheckCircle2, Compass, Timer, TrendingUp } from 'lucide-react';
import { LifeAreaBadge } from '@/components/app/LifeAreaBadge';
import type { WeeklyNarrativeRecap } from '@/lib/types';

interface WeeklyStoryCardProps {
  recap?: WeeklyNarrativeRecap;
  loading?: boolean;
}

export function WeeklyStoryCard({ recap, loading }: WeeklyStoryCardProps) {
  if (loading || !recap) {
    return (
      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="h-5 w-36 rounded bg-secondary animate-pulse" />
        <div className="mt-4 h-24 rounded-lg bg-secondary/70 animate-pulse" />
      </section>
    );
  }

  const focusTotal = recap.focusDistribution.reduce((total, area) => total + area.minutes, 0);

  return (
    <section className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="p-5 border-b border-subtle flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-h3 text-foreground">Weekly Story</h2>
            <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">{recap.weekLabel}</span>
          </div>
          <p className="mt-3 text-sm text-foreground leading-6">{recap.summary}</p>
          <p className="mt-2 text-sm text-muted-foreground">{recap.identityReflection}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:w-72">
          <MiniStat label="closed" value={recap.stats.closedLoopDays} />
          <MiniStat label="actions" value={recap.stats.meaningfulActionDays} />
          <MiniStat label="rate" value={`${recap.stats.loopClosureRate}%`} />
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-lg surface-sunken p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <TrendingUp className="h-4 w-4 text-success" />
            Strongest Area
          </div>
          {recap.strongestArea ? (
            <div className="flex items-center gap-2 flex-wrap">
              <LifeAreaBadge area={recap.strongestArea.area} />
              <span className="text-xs text-muted-foreground">{recap.strongestArea.count} moves</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No clear strongest area yet.</p>
          )}
        </div>

        <div className="rounded-lg surface-sunken p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <Compass className="h-4 w-4 text-warning" />
            Carry Forward
          </div>
          <p className="text-xs text-muted-foreground">{recap.unfinishedThread}</p>
          {recap.neglectedArea && (
            <div className="mt-3">
              <LifeAreaBadge area={recap.neglectedArea.area} />
            </div>
          )}
        </div>

        <div className="rounded-lg surface-sunken p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <Timer className="h-4 w-4 text-primary" />
            Focus Distribution
          </div>
          {recap.focusDistribution.length === 0 ? (
            <p className="text-xs text-muted-foreground">Link focus sessions to tasks to see where attention went.</p>
          ) : (
            <div className="space-y-2">
              {recap.focusDistribution.slice(0, 3).map(area => (
                <div key={area.area}>
                  <div className="flex items-center justify-between gap-3 text-xs mb-1">
                    <span className="text-muted-foreground">{area.label}</span>
                    <span className="text-foreground font-medium tabular-nums">{area.minutes}m</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full gradient-primary" style={{ width: `${Math.max(8, Math.round((area.minutes / Math.max(1, focusTotal)) * 100))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-3 bg-secondary/35 border-t border-subtle flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" />{recap.stats.tasksCompleted} tasks completed</span>
        <span>{recap.stats.habitChecks} habit checks</span>
        <span>{recap.stats.focusMinutes} focus minutes</span>
        <span>{recap.stats.goalsMoved} goals moved</span>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg surface-sunken px-3 py-2 text-center">
      <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
