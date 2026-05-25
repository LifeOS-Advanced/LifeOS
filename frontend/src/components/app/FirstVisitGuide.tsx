import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { markFirstVisitGuideSeen, shouldShowFirstVisitGuide } from '@/lib/daily-loop';
import { setFirstWinFlow, shouldShowFirstVisitGuideNow } from '@/lib/first-win';
import { trackLoopEvent, trackLoopEventOnce } from '@/lib/analytics';

const STEPS = [
  'Start your day',
  'Complete small quests',
  'Close your day',
  'Build your rhythm',
];

export function FirstVisitGuide() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const show = shouldShowFirstVisitGuideNow() || shouldShowFirstVisitGuide();
    if (!show) return;
    const t = setTimeout(() => {
      setOpen(true);
      trackLoopEventOnce('first_visit_guide_shown', 'first_visit_guide_shown');
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const startFirstWin = () => {
    markFirstVisitGuideSeen();
    setFirstWinFlow('daily_start');
    trackLoopEvent('first_visit_guide_completed', { action: 'start_first_win' });
    setOpen(false);
    navigate('/app/daily-start');
  };

  const skip = () => {
    markFirstVisitGuideSeen();
    setOpen(false);
    navigate('/app/daily-start');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && skip()}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <div className="pointer-events-none absolute inset-x-10 -top-28 h-48 rounded-full bg-primary/20 blur-3xl" />
        <DialogHeader>
          <div className="relative h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-2 shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <DialogTitle>Welcome to LifeOS</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 text-left text-sm text-muted-foreground">
              <p>Start with one small loop, then let the system make the next move obvious.</p>
              <ol className="space-y-2 text-foreground">
                {STEPS.map((line, i) => (
                  <li key={line} className="flex items-center gap-2 rounded-lg surface-sunken px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{i + 1}. {line}</span>
                  </li>
                ))}
              </ol>
              <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-foreground font-medium shadow-sm">
                Your first goal: earn your first XP in under 3 minutes.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={skip}>Skip</Button>
          <Button className="gradient-primary text-primary-foreground w-full sm:w-auto" onClick={startFirstWin}>
            Start my first win <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
