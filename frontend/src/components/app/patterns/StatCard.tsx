import { useEffect, useState } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Hook: animates a numeric value from 0 → target over `duration` ms. */
function useCountUp(target: number, duration = 700) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(target)) { setVal(target); return; }
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

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
      <div className="text-2xl font-bold text-foreground tabular-nums">
        <CountValue value={value} />
      </div>
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

/** Renders a number with a brief count-up animation; passes through non-numeric values. */
function CountValue({ value }: { value: string | number }) {
  // Extract numeric prefix from value (e.g. "12.5" from "12.5h" or "84%")
  const raw = String(value);
  const match = raw.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
  const num = match ? parseFloat(match[1]) : 0;
  const animated = useCountUp(num);
  if (!match) return <>{value}</>;
  const suffix = match[2];
  const decimals = (match[1].split('.')[1] || '').length;
  return <>{animated.toFixed(decimals)}{suffix}</>;
}
