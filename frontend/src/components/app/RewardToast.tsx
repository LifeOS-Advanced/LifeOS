import { motion, useReducedMotion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  Flame,
  Shield,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type RewardToastIntensity = 'low' | 'medium' | 'high';
export type RewardToastVariant =
  | 'xp'
  | 'quest'
  | 'loop'
  | 'streak'
  | 'level'
  | 'achievement'
  | 'freeze'
  | 'focus';

export interface RewardToastProps {
  title: string;
  description?: string;
  xp?: number;
  intensity?: RewardToastIntensity;
  variant?: RewardToastVariant;
  onDismiss?: () => void;
}

const variantIcon: Record<RewardToastVariant, LucideIcon> = {
  xp: Zap,
  quest: Target,
  loop: CheckCircle2,
  streak: Flame,
  level: Trophy,
  achievement: Award,
  freeze: Shield,
  focus: Sparkles,
};

const variantClass: Record<RewardToastVariant, string> = {
  xp: 'text-primary bg-primary/10 ring-primary/20',
  quest: 'text-accent bg-accent/10 ring-accent/20',
  loop: 'text-success bg-success/10 ring-success/20',
  streak: 'text-warning bg-warning/10 ring-warning/20',
  level: 'text-primary bg-primary/10 ring-primary/20',
  achievement: 'text-accent bg-accent/10 ring-accent/20',
  freeze: 'text-info bg-info/10 ring-info/20',
  focus: 'text-primary bg-primary/10 ring-primary/20',
};

const intensityClass: Record<RewardToastIntensity, string> = {
  low: 'reward-toast-low',
  medium: 'reward-toast-medium',
  high: 'reward-toast-high',
};

export function RewardToast({
  title,
  description,
  xp,
  intensity = 'low',
  variant = 'xp',
  onDismiss,
}: RewardToastProps) {
  const reduceMotion = useReducedMotion();
  const Icon = variantIcon[variant];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'reward-toast group relative flex w-[min(420px,calc(100vw-2rem))] gap-3 overflow-hidden rounded-xl border border-border bg-card p-3.5 text-card-foreground shadow-xl',
        intensityClass[intensity],
      )}
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            'relative z-10 flex h-10 w-10 items-center justify-center rounded-lg ring-1',
            variantClass[variant],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {intensity !== 'low' && <span className="reward-ring" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-foreground">{title}</p>
            {description && (
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{description}</p>
            )}
          </div>
          {typeof xp === 'number' && xp > 0 && (
            <span className="xp-pop shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-primary ring-1 ring-primary/15">
              +{xp} XP
            </span>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss reward"
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}
