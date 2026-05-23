import { LIFE_AREAS } from '@/lib/life-areas';
import { LifeArea } from '@/lib/types';
import { LayoutGrid } from 'lucide-react';

interface Props {
  value: LifeArea | 'all';
  onChange: (v: LifeArea | 'all') => void;
}

export function LifeAreaFilter({ value, onChange }: Props) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap border';
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      <button
        onClick={() => onChange('all')}
        className={`${base} ${value === 'all' ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:text-foreground'}`}
      >
        <LayoutGrid className="h-3 w-3" />
        All
      </button>
      {LIFE_AREAS.map(area => {
        const Icon = area.icon;
        const active = value === area.id;
        return (
          <button
            key={area.id}
            onClick={() => onChange(area.id)}
            className={`${base} ${active ? `${area.bg} ${area.color} border-transparent` : 'bg-card text-muted-foreground border-border hover:text-foreground'}`}
          >
            <Icon className="h-3 w-3" />
            {area.label}
          </button>
        );
      })}
    </div>
  );
}
