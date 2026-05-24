import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChipProps {
  children: ReactNode;
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
  variant?: 'default' | 'outline' | 'solid';
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export function Chip({ children, onRemove, onClick, active, variant = 'default', size = 'sm', icon }: ChipProps) {
  const sizing = size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5';
  const styles =
    variant === 'solid'
      ? 'bg-primary text-primary-foreground border-transparent'
      : variant === 'outline'
        ? 'bg-transparent border-border text-foreground'
        : active
          ? 'bg-primary/10 text-primary border-primary/30'
          : 'bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/70';

  const className = cn('inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors', sizing, styles);
  const content = (
    <>
      {icon}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 -mr-1"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </>
  );

  if (onClick && !onRemove) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <span
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={className}
    >
      {content}
    </span>
  );
}
