import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getWeeklyReviews } from '@/lib/store';
import { startOfWeek, ymd } from '@/lib/insights';
import { Sparkles } from 'lucide-react';

/**
 * Auto-opens on Sunday if no review exists for the current week.
 * Dismissal is per-week (stored in localStorage).
 */
export function WeeklyReviewPrompt() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const weekStart = ymd(startOfWeek());

  useEffect(() => {
    const isSunday = new Date().getDay() === 0;
    if (!isSunday) return;
    const reviews = getWeeklyReviews();
    if (reviews.some(r => r.weekStart === weekStart)) return;
    const dismissed = localStorage.getItem(`lifeos_review_prompt_dismissed_${weekStart}`);
    if (dismissed) return;
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [weekStart]);

  const dismiss = () => {
    localStorage.setItem(`lifeos_review_prompt_dismissed_${weekStart}`, '1');
    setOpen(false);
  };

  const go = () => {
    setOpen(false);
    navigate('/app/review');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center mb-2">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <DialogTitle>Time for your weekly review</DialogTitle>
          <DialogDescription>
            Sundays are for stepping back. Reflect on the week, spot what got ignored, and set the tone for the next one.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={dismiss}>Maybe later</Button>
          <Button onClick={go}>Start review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
