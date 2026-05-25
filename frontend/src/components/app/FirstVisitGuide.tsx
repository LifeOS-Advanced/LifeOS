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
import { Sparkles } from 'lucide-react';
import { markFirstVisitGuideSeen, shouldShowFirstVisitGuide } from '@/lib/daily-loop';
import { setFirstWinFlow, shouldShowFirstVisitGuideNow } from '@/lib/first-win';

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
    const t = setTimeout(() => setOpen(true), 400);
    return () => clearTimeout(t);
  }, []);

  const startFirstWin = () => {
    markFirstVisitGuideSeen();
    setFirstWinFlow('daily_start');
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center mb-2">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <DialogTitle>Welcome to LifeOS</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 text-left text-sm text-muted-foreground">
              <p>LifeOS works like this:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-foreground">
                {STEPS.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
              <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-foreground font-medium">
                Your first goal: earn your first XP in under 3 minutes.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={skip}>Skip</Button>
          <Button className="gradient-primary text-primary-foreground w-full sm:w-auto" onClick={startFirstWin}>
            Start my first win
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
