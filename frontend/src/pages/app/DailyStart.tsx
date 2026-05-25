import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Battery, CheckCircle2, CheckSquare, Circle, Sparkles, Timer, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EnergyLevel, Mood } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';
import { useDailyStart, useHabits, useSaveDailyStart, useTasks, queryKeys } from '@/lib/queries';
import { dailyStartSchema, validateOrToast } from '@/lib/schemas';
import { emitRewardMoment } from '@/lib/reward-feedback';
import { getFirstWinFlow, setFirstWinFlow } from '@/lib/first-win';
import { isNewUserSession } from '@/lib/daily-loop';

const today = () => new Date().toISOString().split('T')[0];

export default function DailyStartPage() {
  const navigate = useNavigate();
  const date = today();
  const { data: tasks = [] } = useTasks();
  const { data: habits = [] } = useHabits();
  const { data: existing } = useDailyStart(date);
  const saveDailyStart = useSaveDailyStart();
  const qc = useQueryClient();
  const [mood, setMood] = useState<Mood>(existing?.mood ?? 4);
  const [energy, setEnergy] = useState<EnergyLevel>(existing?.energy ?? 'medium');
  const [mainPriority, setMainPriority] = useState(existing?.mainPriority ?? '');
  const [topTaskIds, setTopTaskIds] = useState<string[]>(existing?.topTaskIds ?? []);
  const [habitIds, setHabitIds] = useState<string[]>(existing?.habitIds ?? []);
  const [focusDuration, setFocusDuration] = useState(existing?.suggestedFocusDuration ?? 25);

  const openTasks = useMemo(() => tasks.filter(t => t.status !== 'done').slice(0, 12), [tasks]);
  const habitsDue = useMemo(() => {
    const t = date;
    return habits.filter(h => h.frequency === 'daily' && !h.completedDates.includes(t));
  }, [habits, date]);

  const toggleTopTask = (id: string) => {
    setTopTaskIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(0, 3));
  };

  const toggleHabit = (id: string) => {
    setHabitIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = async () => {
    const valid = validateOrToast(dailyStartSchema, {
      date,
      mood,
      energy,
      mainPriority,
      topTaskIds,
      habitIds,
      suggestedFocusDuration: focusDuration,
    });
    if (!valid) return;

    try {
      const { progress } = await saveDailyStart.mutateAsync(valid);
      toast.success('Day started', { description: 'Your plan is on the dashboard.' });
      if (progress) {
        qc.setQueryData(queryKeys.progress, progress);
        emitRewardMoment(progress, { eventType: 'daily_start' });
      }
      const flow = getFirstWinFlow();
      if (flow === 'daily_start' && isNewUserSession()) {
        setFirstWinFlow('habit_check');
        navigate('/app/habits?firstWin=1');
        return;
      }
      navigate('/app');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save Daily Start');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <p className="text-eyebrow">Morning planning</p>
        <h1 className="text-h1 text-foreground">Daily Start</h1>
        <p className="text-sm text-muted-foreground">Choose the work your future self will be glad you protected.</p>
      </header>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label>Mood</Label>
            <Select value={String(mood)} onValueChange={(v) => setMood(Number(v) as Mood)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={String(v)}>{v}/5</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Energy</Label>
            <Select value={energy} onValueChange={(v) => setEnergy(v as EnergyLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Focus block</Label>
            <Select value={String(focusDuration)} onValueChange={(v) => setFocusDuration(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[15, 25, 45, 50, 90].map(v => <SelectItem key={v} value={String(v)}>{v} minutes</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Today’s main priority</Label>
          <Input value={mainPriority} onChange={(e) => setMainPriority(e.target.value)} placeholder="What must move forward today?" />
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <Panel icon={CheckSquare} title="Top 3 Tasks" subtitle={`${topTaskIds.length}/3 selected`}>
          {openTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open tasks yet.</p>
          ) : openTasks.map(task => (
            <button key={task.id} onClick={() => toggleTopTask(task.id)} className="w-full flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-secondary/60">
              {topTaskIds.includes(task.id) ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
              <span className="text-[10px] text-muted-foreground">I{task.importance} U{task.urgency}</span>
            </button>
          ))}
        </Panel>

        <Panel icon={Zap} title="Habits Due Today" subtitle={`${habitIds.length} selected`}>
          {habitsDue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No daily habits due right now.</p>
          ) : habitsDue.map(habit => (
            <button key={habit.id} onClick={() => toggleHabit(habit.id)} className="w-full flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-secondary/60">
              {habitIds.includes(habit.id) ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm text-foreground flex-1 truncate">{habit.title}</span>
              <span className="text-[10px] text-muted-foreground">{habit.streak}d</span>
            </button>
          ))}
        </Panel>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-primary text-primary-foreground flex items-center justify-center"><Sparkles className="h-5 w-5" /></div>
          <div>
            <h2 className="text-h3 text-foreground">Ready to start?</h2>
            <p className="text-xs text-muted-foreground">This saves today’s plan and pins it to your dashboard.</p>
          </div>
        </div>
        <Button onClick={submit} disabled={saveDailyStart.isPending} className="gradient-primary text-primary-foreground">
          Confirm and start day
        </Button>
      </section>
    </div>
  );
}

function Panel({ icon: Icon, title, subtitle, children }: { icon: typeof Battery; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="text-h3 text-foreground">{title}</h2>
        </div>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
