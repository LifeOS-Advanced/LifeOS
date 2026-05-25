import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sunrise, Target, Moon, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { DailyLoopHero as Hero } from '@/lib/daily-loop';
import { MotivationalQuoteBar } from './MotivationalQuoteBar';
import type { ImprovementArea } from '@/lib/types';

const icons = {
  start_day: Sunrise,
  next_quest: Target,
  close_day: Moon,
  complete: CheckCircle2,
};

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

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/8 via-card to-card p-5 shadow-card space-y-4"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg gradient-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Today&apos;s loop: {questsDone}/{questsTotal} complete
            </p>
            {isNewUser && (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-accent">First week</span>
            )}
          </div>
        </div>
        <span className="text-2xl font-bold tabular-nums text-primary">{loopPercent}%</span>
      </div>

      <Progress value={loopPercent} className="h-2" />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
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
        className="opacity-90"
      />
    </motion.section>
  );
}
