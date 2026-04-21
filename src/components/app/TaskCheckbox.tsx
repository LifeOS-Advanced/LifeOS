import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Animated round checkbox used for task completion.
 * Includes a spring scale + check fade + soft ring burst on completion.
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
  const iconSize = size === 'sm' ? 10 : 12;

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
          <motion.span
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center"
          >
            <Check size={iconSize} strokeWidth={3.5} />
          </motion.span>
        )}
      </AnimatePresence>
      {bursting && <span className="burst absolute inset-0 rounded-full" aria-hidden />}
    </button>
  );
}
