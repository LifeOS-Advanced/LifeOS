import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TaskCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Animated round checkbox used for task completion.
 * Uses an SVG path with `pathLength` so the checkmark visibly draws itself in,
 * plus a soft ring burst on first completion.
 */
export function TaskCheckbox({ checked, onChange, size = 'md', className }: TaskCheckboxProps) {
  const [bursting, setBursting] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!checked) {
      setBursting(true);
      setTimeout(() => setBursting(false), 600);
    }
    onChange(!checked);
  };

  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const svgSize = size === 'sm' ? 10 : 12;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={checked}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full border-2 shrink-0 transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        sizeClass,
        checked
          ? 'border-success bg-success text-success-foreground'
          : 'border-border hover:border-primary bg-transparent',
        className,
      )}
    >
      <AnimatePresence>
        {checked && (
          <motion.svg
            key="check"
            width={svgSize}
            height={svgSize}
            viewBox="0 0 24 24"
            fill="none"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.path
              d="M5 12.5L10 17.5L19 7.5"
              stroke="currentColor"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
      {bursting && <span className="burst absolute inset-0 rounded-full" aria-hidden />}
    </button>
  );
}
