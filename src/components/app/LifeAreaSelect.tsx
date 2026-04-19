import { LIFE_AREAS } from '@/lib/life-areas';
import { LifeArea } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  value?: LifeArea;
  onChange: (v: LifeArea | undefined) => void;
  placeholder?: string;
}

export function LifeAreaSelect({ value, onChange, placeholder = 'Pick a life area' }: Props) {
  return (
    <Select
      value={value ?? 'none'}
      onValueChange={v => onChange(v === 'none' ? undefined : (v as LifeArea))}
    >
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No area</SelectItem>
        {LIFE_AREAS.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
