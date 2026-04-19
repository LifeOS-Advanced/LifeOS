import { LifeArea } from '@/lib/types';
import { getLifeArea } from '@/lib/life-areas';

interface Props {
  area?: LifeArea;
  size?: 'sm' | 'md';
}

export function LifeAreaBadge({ area, size = 'sm' }: Props) {
  const meta = getLifeArea(area);
  if (!meta) return null;
  const Icon = meta.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${meta.bg} ${meta.color} ${padding}`}>
      <Icon className={iconSize} />
      {meta.label}
    </span>
  );
}
