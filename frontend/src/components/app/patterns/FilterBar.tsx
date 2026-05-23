import { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Chip } from './Chip';

export interface FilterOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface FilterBarProps {
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  options?: FilterOption[];
  active?: string[];
  onToggle?: (value: string) => void;
  onClear?: () => void;
  trailing?: ReactNode;
}

export function FilterBar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  options,
  active = [],
  onToggle,
  onClear,
  trailing,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        {onSearch && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search || ''}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-9"
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">{trailing}</div>
      </div>
      {options && options.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {options.map((opt) => (
            <Chip
              key={opt.value}
              active={active.includes(opt.value)}
              onClick={() => onToggle?.(opt.value)}
              icon={opt.icon}
            >
              {opt.label}
            </Chip>
          ))}
          {active.length > 0 && onClear && (
            <button
              onClick={onClear}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
