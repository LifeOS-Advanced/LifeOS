import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
  accent?: 'primary' | 'success' | 'warning' | 'muted';
  className?: string;
}

const accentMap = {
  primary: 'text-primary bg-primary/10',
  success: 'text-green-600 dark:text-green-400 bg-green-500/10',
  warning: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  muted: 'text-muted-foreground bg-muted',
};

export function StatCard({ icon: Icon, label, value, hint, trend, trendLabel, accent = 'primary', className }: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-md transition-shadow', className)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center', accentMap[accent])}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {trend && (
          <span className={cn('inline-flex items-center gap-0.5 font-medium', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {trendLabel}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </motion.div>
  );
}
