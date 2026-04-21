import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addCheckIn, getTodayCheckIn } from '@/lib/store';
import { Mood, EnergyLevel } from '@/lib/types';
import { Battery, BatteryLow, BatteryMedium } from 'lucide-react';
import { toast } from 'sonner';

const MOOD_FACES: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

const ENERGY_OPTIONS: { value: EnergyLevel; label: string; icon: typeof Battery }[] = [
  { value: 'low', label: 'Low', icon: BatteryLow },
  { value: 'medium', label: 'Medium', icon: BatteryMedium },
  { value: 'high', label: 'High', icon: Battery },
];

export function DailyCheckInModal() {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<Mood>(3);
  const [energy, setEnergy] = useState<EnergyLevel>('medium');
  const [mainFocus, setMainFocus] = useState('');
  const [oneWord, setOneWord] = useState('');

  useEffect(() => {
    const today = getTodayCheckIn();
    const dismissedKey = `lifeos_checkin_dismissed_${new Date().toISOString().split('T')[0]}`;
    const dismissed = sessionStorage.getItem(dismissedKey);
    if (!today && !dismissed) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = (next: boolean) => {
    if (!next) {
      const dismissedKey = `lifeos_checkin_dismissed_${new Date().toISOString().split('T')[0]}`;
      sessionStorage.setItem(dismissedKey, '1');
    }
    setOpen(next);
  };

  const handleSubmit = () => {
    const today = new Date().toISOString().split('T')[0];
    addCheckIn({
      date: today,
      mood,
      energy,
      mainFocus: mainFocus.trim(),
      oneWord: oneWord.trim(),
      createdAt: new Date().toISOString(),
    });
    toast.success('Check-in saved', { description: 'Have a focused day ahead.' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daily check-in</DialogTitle>
          <DialogDescription>A 30-second pulse to set the tone for today.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Mood</Label>
            <div className="flex justify-between gap-1 mt-2">
              {MOOD_FACES.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-lg border py-2 transition-all ${
                    mood === m.value
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-border hover:border-primary/40 hover:bg-secondary'
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Energy</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {ENERGY_OPTIONS.map(e => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEnergy(e.value)}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-sm transition-all ${
                    energy === e.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <e.icon className="h-4 w-4" />
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="mainFocus" className="text-xs text-muted-foreground uppercase tracking-wide">Main focus today</Label>
            <Input id="mainFocus" placeholder="Ship the landing page" value={mainFocus} onChange={e => setMainFocus(e.target.value)} className="mt-2" />
          </div>

          <div>
            <Label htmlFor="oneWord" className="text-xs text-muted-foreground uppercase tracking-wide">One word for the day</Label>
            <Input id="oneWord" placeholder="Build" value={oneWord} onChange={e => setOneWord(e.target.value)} maxLength={20} className="mt-2" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => handleClose(false)}>Skip today</Button>
            <Button onClick={handleSubmit}>Save check-in</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
