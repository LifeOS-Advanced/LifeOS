import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass, Shield, Sparkles, Target } from 'lucide-react';
import type { IdentitySignal } from '@/lib/types';

interface BecomingCardProps {
  signal: IdentitySignal;
  closedLoopDays?: number;
  loopClosureRate?: number;
}

const toneIcon = {
  focus: Shield,
  consistency: CheckCircle2,
  balance: Compass,
  'follow-through': Target,
  start: Sparkles,
} as const;

export function BecomingCard({ signal, closedLoopDays = 0, loopClosureRate = 0 }: BecomingCardProps) {
  const Icon = toneIcon[signal.tone] ?? Sparkles;

  return (
    <section className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-secondary text-primary flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-h3 text-foreground">Recent Pattern</h2>
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Evidence</span>
            </div>
            <p className="mt-2 text-base font-semibold text-foreground">{signal.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{signal.description}</p>
            {signal.detail && <p className="mt-2 text-xs text-muted-foreground">{signal.detail}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:w-56">
          <div className="rounded-lg surface-sunken px-3 py-2">
            <p className="text-lg font-semibold text-foreground tabular-nums">{closedLoopDays}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">closed days</p>
          </div>
          <div className="rounded-lg surface-sunken px-3 py-2">
            <p className="text-lg font-semibold text-foreground tabular-nums">{loopClosureRate}%</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">loop rate</p>
          </div>
        </div>
      </div>

      <Link to="/app/progress" className="flex items-center justify-between gap-3 border-t border-subtle bg-secondary/35 px-5 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <span>Patterns update when there is enough recent evidence.</span>
        <span className="inline-flex items-center gap-1 text-primary font-medium">Progress <ArrowRight className="h-3.5 w-3.5" /></span>
      </Link>
    </section>
  );
}
