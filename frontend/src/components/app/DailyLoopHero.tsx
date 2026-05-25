import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Moon, Sparkles, Sunrise, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { DailyLoopHero as Hero } from '@/lib/daily-loop';
import { MotivationalQuoteBar } from './MotivationalQuoteBar';
import type { ImprovementArea } from '@/lib/types';
import { cn } from '@/lib/utils';

const icons = {
  start_day: Sunrise,
  next_quest: Target,
  close_day: Moon,
  complete: CheckCircle2,
};

const phaseTone = {
  start_day: {
    label: 'Intention',
    className: 'from-primary/10 via-card to-accent/8 border-primary/25',
  },
  next_quest: {
    label: 'Action',
    className: 'from-accent/10 via-card to-primary/8 border-accent/25',
  },
  close_day: {
    label: 'Closure',
    className: 'from-warning/10 via-card to-primary/8 border-warning/25',
  },
  complete: {
    label: 'Closed',
    className: 'from-success/12 via-card to-accent/10 border-success/25',
  },
} as const;

interface DailyLoopHeroCardProps {
  hero: Hero;
  loopPercent?: number;
  questsDone?: number;
  questsTotal?: number;
  improvementFocus?: ImprovementArea[];
  isNewUser?: boolean;
}

export function DailyLoopHeroCard({
  hero,
  loopPercent = 0,
  questsDone = 0,
  questsTotal = 6,
  improvementFocus,
  isNewUser,
}: DailyLoopHeroCardProps) {
  const Icon = icons[hero.phase];
  const tone = phaseTone[hero.phase];
  const complete = loopPercent >= 100 || hero.phase === 'complete';
  const almostComplete = !complete && loopPercent >= 80;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 shadow-card space-y-5',
        tone.className,
        almostComplete && 'reward-surface-near',
        complete && 'reward-surface-complete',
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-11 w-11 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-glow">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">Today's loop</p>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-primary">
                {tone.label}
              </span>
              {isNewUser && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-accent">First week</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {questsDone}/{questsTotal} steps complete
            </p>
          </div>
        </div>
        <div className="relative h-16 w-16 shrink-0 rounded-2xl bg-card/80 p-2 ring-1 ring-border shadow-sm">
          <div
            className="grid h-full w-full place-items-center rounded-xl text-sm font-bold tabular-nums text-primary"
            style={{
              background: `conic-gradient(hsl(var(--primary)) ${loopPercent * 3.6}deg, hsl(var(--secondary)) 0deg)`,
            }}
          >
            <span className="grid h-[calc(100%-6px)] w-[calc(100%-6px)] place-items-center rounded-lg bg-card">
              {loopPercent}%
            </span>
          </div>
        </div>
      </div>

      <div className="relative">
        <Progress value={loopPercent} className="reward-progress h-2" />
        {almostComplete && <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-primary" />}
      </div>

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground capitalize">
            Next: {hero.nextLine}
          </p>
          {hero.description ? (
            <p className="text-xs text-muted-foreground mt-0.5">{hero.description}</p>
          ) : null}
        </div>
        <Button asChild className="gradient-primary text-primary-foreground shrink-0">
          <Link to={hero.route}>
            {hero.ctaLabel}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      <MotivationalQuoteBar
        phase={hero.phase}
        improvementFocus={improvementFocus}
        className="relative opacity-90"
      />
    </motion.section>
  );
}
