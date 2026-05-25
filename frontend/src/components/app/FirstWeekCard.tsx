import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { buildFirstWeekSteps, FIRST_WEEK_DISMISS_KEY } from '@/lib/daily-loop';
import { cn } from '@/lib/utils';

interface FirstWeekCardProps {
  dailyStartDone: boolean;
  habitChecked: boolean;
  focusDone: boolean;
  eveningShutdownDone: boolean;
  hasHabit: boolean;
}

export function FirstWeekCard(props: FirstWeekCardProps) {
  const steps = buildFirstWeekSteps(props);
  const doneCount = steps.filter(s => s.done).length;
  const percent = Math.round((doneCount / Math.max(1, steps.length)) * 100);

  if (doneCount === steps.length) return null;

  const dismiss = () => {
    localStorage.setItem(FIRST_WEEK_DISMISS_KEY, '1');
    window.dispatchEvent(new Event('lifeos-first-week-dismiss'));
  };

  return (
    <section className="relative overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-br from-primary/6 via-card to-accent/6 p-5 shadow-card">
      <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-eyebrow text-primary">First week</p>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-h3 text-foreground">Get your rhythm</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {doneCount}/{steps.length} steps - first wins unlock XP and streak momentum.
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={dismiss} aria-label="Dismiss">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Progress value={percent} className="reward-progress mb-4 h-1.5" />

      <ul className="relative space-y-2">
        {steps.map(step => (
          <li key={step.id}>
            <Link
              to={step.route}
              className={cn(
                'group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                step.done
                  ? 'border-success/20 bg-success/5'
                  : 'border-border bg-card/70 hover:bg-secondary/60',
              )}
            >
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={cn('min-w-0 flex-1 text-sm', step.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                {step.label}
              </span>
              {!step.done && (
                <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
