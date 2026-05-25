import { ArrowRight, CheckCircle2, CornerDownRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LifeAreaBadge } from '@/components/app/LifeAreaBadge';
import type { WeeklyReview } from '@/lib/types';

interface CarryForwardCardProps {
  review: WeeklyReview;
  compact?: boolean;
  onUse?: () => void;
  onDone?: () => void;
  onDismiss?: () => void;
}

export function CarryForwardCard({ review, compact, onUse, onDone, onDismiss }: CarryForwardCardProps) {
  const carry = review.carryForward;
  if (!carry?.text?.trim() || carry.status !== 'open') return null;

  return (
    <section className="relative overflow-hidden rounded-xl border border-accent/20 bg-gradient-to-br from-accent/8 via-card to-card p-4 shadow-card">
      <div className="pointer-events-none absolute -left-20 top-0 h-28 w-28 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/15">
              <CornerDownRight className="h-3.5 w-3.5" />
            </span>
            <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">Carry forward</p>
            {carry.sourceArea && <LifeAreaBadge area={carry.sourceArea} />}
          </div>
          <p className="mt-2 text-sm text-foreground">{compact ? carry.text : `From last week: ${carry.text}`}</p>
          <p className="mt-1 text-xs text-muted-foreground">Saved from week of {new Date(`${review.weekStart}T00:00:00.000Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.</p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {onUse ? (
            <Button size="sm" onClick={onUse}>
              Use in Daily Start <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link to="/app/daily-start">Use in Daily Start <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          )}
          {onDone && (
            <Button size="sm" variant="outline" onClick={onDone}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark done
            </Button>
          )}
          {onDismiss && (
            <Button size="icon" variant="ghost" onClick={onDismiss} aria-label="Dismiss carry-forward">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
