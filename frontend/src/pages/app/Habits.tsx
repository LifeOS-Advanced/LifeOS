import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LifeArea } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Star, Check, Zap, Target, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { LifeAreaBadge } from '@/components/app/LifeAreaBadge';
import { LifeAreaSelect } from '@/components/app/LifeAreaSelect';
import { LifeAreaFilter } from '@/components/app/LifeAreaFilter';
import { EmptyState } from '@/components/app/EmptyState';
import { useNewParam } from '@/hooks/use-new-param';
import { habitFormSchema, validateOrToast } from '@/lib/schemas';
import { useCreateHabit, useGoals, useHabits, useProfile, useRecordProgressEvent, useToggleHabit } from '@/lib/queries';
import { emitRewardMoment } from '@/lib/reward-feedback';
import { getFirstWinFlow, setFirstWinFlow } from '@/lib/first-win';

export default function Habits() {
  const [searchParams] = useSearchParams();
  const firstWinMode = searchParams.get('firstWin') === '1';
  const goalFilter = searchParams.get('goalId');
  const { data: goals = [] } = useGoals();
  const { data: profile } = useProfile();
  const { data: habits = [], isLoading } = useHabits();
  const createHabitMutation = useCreateHabit();
  const toggleHabitMutation = useToggleHabit();
  const recordProgress = useRecordProgressEvent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [areaFilter, setAreaFilter] = useState<LifeArea | 'all'>('all');
  const [form, setForm] = useState<{ title: string; description: string; frequency: 'daily' | 'weekly'; lifeArea?: LifeArea; goalId?: string }>({ title: '', description: '', frequency: 'daily' });
  const today = new Date().toISOString().split('T')[0];

  useNewParam(() => setDialogOpen(true));

  useEffect(() => {
    if (!firstWinMode) return;
    if (habits.length === 0) setDialogOpen(true);
  }, [firstWinMode, habits.length]);

  const [pulsing, setPulsing] = useState<string | null>(null);

  const toggleToday = (id: string) => {
    const habit = habits.find(h => h.id === id);
    const wasDone = habit?.completedDates.includes(today);
    if (!wasDone) {
      setPulsing(id);
      setTimeout(() => setPulsing(null), 600);
    }
    toggleHabitMutation.mutate(
      { id, date: today },
      {
        onSuccess: async (updated) => {
          if (wasDone) return;
          try {
            const progress = await recordProgress.mutateAsync({
              type: 'habit_checked',
              date: today,
              entityId: id,
              title: 'Habit checked',
              description: habit?.title,
              metadata: { key: `habit_checked:${id}:${today}`, streak: updated.streak, goalId: updated.goalId, lifeArea: updated.lifeArea },
            });
            emitRewardMoment(progress, {
              eventType: 'habit_checked',
              profile,
              lifeArea: updated.lifeArea,
              goalTitle: goals.find(goal => goal.id === updated.goalId)?.title,
            });
            if (getFirstWinFlow() === 'habit_check') {
              setFirstWinFlow('done');
            }
          } catch {
            // Reward feedback is non-critical; the habit update already succeeded.
          }
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not update habit'),
      },
    );
  };

  const createHabit = async () => {
    const valid = validateOrToast(habitFormSchema, { title: form.title, description: form.description, frequency: form.frequency });
    if (!valid) return;
    try {
      await createHabitMutation.mutateAsync({
        title: form.title,
        description: form.description,
        frequency: form.frequency,
        lifeArea: form.lifeArea,
        goalId: form.goalId,
      });
      setForm({ title: '', description: '', frequency: 'daily' });
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create habit');
    }
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const visible = habits.filter(h => {
    if (goalFilter && h.goalId !== goalFilter) return false;
    return areaFilter === 'all' || h.lifeArea === areaFilter;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {firstWinMode && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
          <p className="font-semibold text-foreground">Your first win</p>
          <p className="text-muted-foreground mt-0.5">
            Tap your habit for today — you&apos;ll earn XP in seconds.
          </p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Habits</h1>
          <p className="text-muted-foreground text-sm">Build consistency, one day at a time.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90"><Plus className="h-4 w-4 mr-2" />New Habit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Habit</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Morning meditation" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v as 'daily' | 'weekly' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Life Area</Label><LifeAreaSelect value={form.lifeArea} onChange={v => setForm({ ...form, lifeArea: v })} /></div>
              </div>
              <div><Label>Supports Goal</Label>
                <Select value={form.goalId ?? 'none'} onValueChange={v => setForm({ ...form, goalId: v === 'none' ? undefined : v })}>
                  <SelectTrigger><SelectValue placeholder="No goal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No goal</SelectItem>
                    {goals.map(g => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createHabit} disabled={createHabitMutation.isPending} className="w-full gradient-primary text-primary-foreground">Create Habit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <LifeAreaFilter value={areaFilter} onChange={setAreaFilter} />

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-xl border border-border bg-card shadow-card text-center py-12 text-muted-foreground">Loading habits...</div>
        ) : habits.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No habits yet"
            description="Tiny daily reps compound into who you become. Pick one habit to start."
            ctaLabel="Create Habit"
            onCta={() => setDialogOpen(true)}
            tip="Start absurdly small — 2 minutes a day beats 'someday'."
          />
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-border bg-card shadow-card text-center py-16">
            <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No habits in this life area yet.</p>
          </div>
        ) : visible.map((habit, i) => {
          const goal = goals.find(g => g.id === habit.goalId);
          return (
            <motion.div
              key={habit.id}
              className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleToday(habit.id)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${pulsing === habit.id ? 'habit-pulse' : ''} ${habit.completedDates.includes(today) ? 'gradient-accent text-accent-foreground scale-105' : 'bg-secondary text-muted-foreground hover:bg-accent/20 hover:scale-105'}`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{habit.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground capitalize">{habit.frequency}</span>
                      <LifeAreaBadge area={habit.lifeArea} />
                      {goal && (
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          <Target className="h-3 w-3" />{goal.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(() => {
                    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                    const y = yesterday.toISOString().split('T')[0];
                    const atRisk = habit.frequency === 'daily'
                      && habit.streak > 0
                      && !habit.completedDates.includes(today)
                      && !habit.completedDates.includes(y);
                    return atRisk ? (
                      <span title="Streak at risk — complete today to keep it alive" className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" /> at risk
                      </span>
                    ) : null;
                  })()}
                  <div className="flex items-center gap-1.5 text-warning">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-semibold">{habit.streak}d</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {last7Days.map(day => (
                  <div
                    key={day}
                    className={`h-8 flex-1 rounded-md flex items-center justify-center text-xs ${habit.completedDates.includes(day) ? 'gradient-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}
                  >
                    {new Date(day).toLocaleDateString('en', { weekday: 'narrow' })}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
