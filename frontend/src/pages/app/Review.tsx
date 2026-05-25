import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Zap, Timer, Target, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { computeWeeklyStats } from '@/lib/insights';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LifeAreaBadge } from '@/components/app/LifeAreaBadge';
import { WeeklyStoryCard } from '@/components/app/WeeklyStoryCard';
import { toast } from 'sonner';
import { useFocusSessions, useGoals, useHabits, useProfile, useSaveWeeklyReview, useTasks, useWeeklyNarrative } from '@/lib/queries';
import { emitRewardMoment } from '@/lib/reward-feedback';
import { useQuery } from '@tanstack/react-query';
import { dataLayer } from '@/lib/data-layer';
import { buildCarryForwardFromNarrative, nextWeekStart } from '@/lib/continuity';

const fadeIn = (delay: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.4 } });

export default function Review() {
  const saveReview = useSaveWeeklyReview();
  const { data: tasks = [] } = useTasks();
  const { data: habits = [] } = useHabits();
  const { data: goals = [] } = useGoals();
  const { data: sessions = [] } = useFocusSessions();
  const { data: profile } = useProfile();
  const { data: reviews = [] } = useQuery({ queryKey: ['weekly-reviews'], queryFn: () => dataLayer.listWeeklyReviews() });
  const stats = useMemo(() => computeWeeklyStats(tasks, habits, goals, sessions), [tasks, habits, goals, sessions]);
  const { data: weeklyNarrative, isLoading: narrativeLoading } = useWeeklyNarrative(stats.weekStart);
  const existing = reviews.find(r => r.weekStart === stats.weekStart);
  const [wentWell, setWentWell] = useState(existing?.wentWell ?? '');
  const [gotIgnored, setGotIgnored] = useState(existing?.gotIgnored ?? '');
  const [improveNext, setImproveNext] = useState(existing?.improveNext ?? '');
  const suggestedCarryForward = useMemo(
    () => weeklyNarrative ? buildCarryForwardFromNarrative(weeklyNarrative) : undefined,
    [weeklyNarrative],
  );
  const [carryForwardText, setCarryForwardText] = useState(existing?.carryForward?.text ?? suggestedCarryForward?.text ?? '');
  const [carryForwardTouched, setCarryForwardTouched] = useState(false);

  useEffect(() => {
    if (carryForwardTouched) return;
    setCarryForwardText(existing?.carryForward?.text ?? suggestedCarryForward?.text ?? '');
  }, [existing?.carryForward?.text, suggestedCarryForward?.text, carryForwardTouched]);

  const maxDay = Math.max(1, ...stats.byDay.map(d => d.tasks + d.habits + Math.round(d.focus / 25)));

  const handleSave = async () => {
    try {
      const { progress } = await saveReview.mutateAsync({
        id: existing?.id,
        weekStart: stats.weekStart,
        wentWell: wentWell.trim(),
        gotIgnored: gotIgnored.trim(),
        improveNext: improveNext.trim(),
        carryForward: carryForwardText.trim()
          ? {
            ...(existing?.carryForward ?? suggestedCarryForward),
            text: carryForwardText.trim(),
            source: existing?.carryForward?.source ?? suggestedCarryForward?.source ?? 'manual',
            status: 'open',
            createdFromWeekStart: existing?.carryForward?.createdFromWeekStart ?? stats.weekStart,
            targetWeekStart: existing?.carryForward?.targetWeekStart ?? nextWeekStart(stats.weekStart),
          }
          : undefined,
      });
      toast.success('Review saved', { description: 'Reflection captured for this week.' });
      if (progress) emitRewardMoment(progress, { eventType: 'weekly_review', profile });
    } catch {
      toast.error('Could not save review');
    }
  };

  const cards = [
    { label: 'Tasks completed', value: stats.tasksCompleted, icon: CheckSquare, color: 'text-primary' },
    { label: 'Habit consistency', value: `${stats.habitConsistency}%`, icon: Zap, color: 'text-accent' },
    { label: 'Focus minutes', value: stats.focusMinutes, icon: Timer, color: 'text-success' },
    { label: 'Goals progressing', value: stats.goalsProgressed, icon: Target, color: 'text-warning' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Weekly Review</h1>
        <p className="text-muted-foreground mt-1">A pause to reflect, not just track. Week of {new Date(stats.weekStart).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}.</p>
      </motion.div>

      <motion.div {...fadeIn(0.1)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <c.icon className={`h-5 w-5 ${c.color} mb-3`} />
            <p className="text-2xl font-bold text-foreground tabular-nums">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div {...fadeIn(0.16)}>
        <WeeklyStoryCard recap={weeklyNarrative} loading={narrativeLoading} />
      </motion.div>

      <motion.div {...fadeIn(0.2)} className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-semibold text-foreground mb-4">Week at a glance</h2>
        <div className="flex items-end justify-between gap-2 h-32">
          {stats.byDay.map(d => {
            const total = d.tasks + d.habits + Math.round(d.focus / 25);
            const h = (total / maxDay) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md gradient-primary transition-all duration-500"
                    style={{ height: `${Math.max(h, 4)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div {...fadeIn(0.3)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-success" />
            <h3 className="font-semibold text-foreground">Most productive area</h3>
          </div>
          {stats.topArea ? (
            <div className="flex items-center gap-3">
              <LifeAreaBadge area={stats.topArea.area} />
              <span className="text-sm text-muted-foreground">{stats.topArea.count} activities this week</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No tracked activity yet.</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-warning" />
            <h3 className="font-semibold text-foreground">Needs attention</h3>
          </div>
          {stats.neglectedArea ? (
            <div className="flex items-center gap-3">
              <LifeAreaBadge area={stats.neglectedArea.area} />
              <span className="text-sm text-muted-foreground">No activity this week</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Every area touched. Nice balance.</p>
          )}
        </div>
      </motion.div>

      <motion.div {...fadeIn(0.4)} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Reflection</h2>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">What went well?</Label>
          <Textarea value={wentWell} onChange={e => setWentWell(e.target.value)} placeholder="Wins, breakthroughs, good streaks…" className="mt-2 min-h-[80px]" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">What got ignored?</Label>
          <Textarea value={gotIgnored} onChange={e => setGotIgnored(e.target.value)} placeholder="Areas you avoided or dropped…" className="mt-2 min-h-[80px]" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">What should improve next week?</Label>
          <Textarea value={improveNext} onChange={e => setImproveNext(e.target.value)} placeholder="One thing you'll change…" className="mt-2 min-h-[80px]" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Carry forward</Label>
          <Textarea
            value={carryForwardText}
            onChange={e => {
              setCarryForwardTouched(true);
              setCarryForwardText(e.target.value);
            }}
            placeholder="One thread to continue next week..."
            className="mt-2 min-h-[72px]"
          />
          <p className="mt-1 text-xs text-muted-foreground">This appears on next week&apos;s dashboard and Daily Start until marked done or dismissed.</p>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => (window.location.href = '/app/tasks?range=week')}>
            Plan next week →
          </Button>
          <Button onClick={handleSave}>{existing ? 'Update review' : 'Save review'}</Button>
        </div>
      </motion.div>
    </div>
  );
}
