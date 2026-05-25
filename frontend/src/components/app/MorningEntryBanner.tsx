import { Link } from 'react-router-dom';
import { Sunrise, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const today = () => new Date().toISOString().split('T')[0];

interface MorningEntryBannerProps {
  dailyStartDone: boolean;
}

/** Slim in-app cue when Daily Start is not done (replaces auto check-in modal). */
export function MorningEntryBanner({ dailyStartDone }: MorningEntryBannerProps) {
  if (dailyStartDone) return null;

  const dismissKey = `lifeos_morning_banner_dismissed_${today()}`;
  if (sessionStorage.getItem(dismissKey)) return null;

  const dismiss = () => {
    sessionStorage.setItem(dismissKey, '1');
    window.dispatchEvent(new Event('lifeos-morning-banner-dismiss'));
  };

  return (
    <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="flex items-center gap-2 text-sm">
        <Sunrise className="h-4 w-4 text-primary shrink-0" />
        <span className="text-foreground">Start your day with Daily Start — mood, priority, and top tasks in one flow.</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button asChild size="sm" className="gradient-primary text-primary-foreground">
          <Link to="/app/daily-start">Daily Start</Link>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dismiss} aria-label="Dismiss">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
