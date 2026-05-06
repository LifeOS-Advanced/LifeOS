import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function SectionHeader({ icon: Icon, title, description, actions, size = 'md' }: SectionHeaderProps) {
  const titleSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h2 className={`${titleSize} font-semibold text-foreground flex items-center gap-2`}>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
