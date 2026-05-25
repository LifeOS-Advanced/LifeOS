import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Moon } from 'lucide-react';
import { useProfile } from '@/lib/queries';
import { DEFAULT_PREFERENCES } from '@/lib/types';

const today = () => new Date().toISOString().split('T')[0];

interface EveningShutdownPromptProps {
  dailyStartDone: boolean;
  eveningShutdownDone: boolean;
}

/**
 * After wind-down hour, prompts to close the day if Daily Start is done but shutdown is not.
 */
export function EveningShutdownPrompt({ dailyStartDone, eveningShutdownDone }: EveningShutdownPromptProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const date = today();
  const { data: profile } = useProfile();

  useEffect(() => {
    if (!dailyStartDone || eveningShutdownDone) return;
    const tz = profile?.preferences?.timezone ?? DEFAULT_PREFERENCES.timezone;
    const hour = Number(
      new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(new Date()),
    );
    const windDownHour = profile?.preferences?.windDownHour ?? 20;
    if (hour < windDownHour) return;

    const dismissedKey = `lifeos_shutdown_prompt_dismissed_${date}`;
    if (sessionStorage.getItem(dismissedKey)) return;

    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [dailyStartDone, eveningShutdownDone, date, profile]);

  const dismiss = () => {
    sessionStorage.setItem(`lifeos_shutdown_prompt_dismissed_${date}`, '1');
    setOpen(false);
  };

  const go = () => {
    setOpen(false);
    navigate('/app/evening-shutdown');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="h-10 w-10 rounded-lg bg-secondary text-primary flex items-center justify-center mb-2">
            <Moon className="h-5 w-5" />
          </div>
          <DialogTitle>Close your day?</DialogTitle>
          <DialogDescription>
            You started strong this morning. A quick Evening Shutdown locks in progress and sets tomorrow’s first move.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={dismiss}>Later</Button>
          <Button onClick={go}>Evening Shutdown</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
