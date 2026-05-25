import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildFirstWeekSteps, FIRST_WEEK_DISMISS_KEY } from '@/lib/daily-loop';

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

  if (doneCount === steps.length) return null;

  const dismiss = () => {
    localStorage.setItem(FIRST_WEEK_DISMISS_KEY, '1');
    window.dispatchEvent(new Event('lifeos-first-week-dismiss'));
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-eyebrow text-primary">First week</p>
          <h2 className="text-h3 text-foreground">Get your rhythm</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {doneCount}/{steps.length} steps · Your first wins unlock XP and streak momentum
            </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={dismiss} aria-label="Dismiss">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ul className="space-y-2">
        {steps.map(step => (
          <li key={step.id}>
            <Link
              to={step.route}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-secondary/60 transition-colors"
            >
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={`text-sm ${step.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {step.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
