import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, CheckSquare, Circle, Moon, Sunrise } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { EnergyLevel, Mood } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';
import { useDailyStart, useEveningShutdown, useSaveEveningShutdown, useTasks, queryKeys } from '@/lib/queries';
import { eveningShutdownSchema, validateOrToast } from '@/lib/schemas';
import { emitRewardMoment } from '@/lib/reward-feedback';

const today = () => new Date().toISOString().split('T')[0];

export default function EveningShutdownPage() {
  const navigate = useNavigate();
  const date = today();
  const { data: tasks = [] } = useTasks();
  const { data: existing } = useEveningShutdown(date);
  const { data: dailyStart } = useDailyStart(date);
  const saveShutdown = useSaveEveningShutdown();
  const qc = useQueryClient();
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(existing?.completedTaskIds ?? tasks.filter(t => t.status === 'done').map(t => t.id));
  const [delayedTaskIds, setDelayedTaskIds] = useState<string[]>(existing?.delayedTaskIds ?? []);
  const [mood, setMood] = useState<Mood>(existing?.mood ?? 3);
  const [energy, setEnergy] = useState<EnergyLevel>(existing?.energy ?? 'medium');
  const [wentWell, setWentWell] = useState(existing?.wentWell ?? '');
  const [improveTomorrow, setImproveTomorrow] = useState(existing?.improveTomorrow ?? '');
  const [tomorrowFirstTask, setTomorrowFirstTask] = useState(existing?.tomorrowFirstTask ?? '');

  const todayTasks = useMemo(() => {
    const t = date;
    return tasks.filter(task => task.dueDate === t || task.status === 'done').slice(0, 14);
  }, [tasks, date]);

  const toggle = (id: string, kind: 'completed' | 'delayed') => {
    if (kind === 'completed') {
      setCompletedTaskIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
      setDelayedTaskIds(prev => prev.filter(x => x !== id));
    } else {
      setDelayedTaskIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
      setCompletedTaskIds(prev => prev.filter(x => x !== id));
    }
  };

  const submit = async () => {
    const valid = validateOrToast(eveningShutdownSchema, {
      date,
      completedTaskIds,
      delayedTaskIds,
      mood,
      energy,
      wentWell,
      improveTomorrow,
      tomorrowFirstTask,
    });
    if (!valid) return;

    try {
      const { progress } = await saveShutdown.mutateAsync(valid);
      toast.success('Evening shutdown saved', { description: 'Rest mode unlocked.' });
      const dailyStartDone = Boolean(dailyStart?.confirmedAt ?? dailyStart?.id);
      if (progress) {
        qc.setQueryData(queryKeys.progress, progress);
        emitRewardMoment(progress, { eventType: 'evening_shutdown', dailyStartDone });
      }
      navigate('/app');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save shutdown');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <p className="text-eyebrow">End-of-day review</p>
        <h1 className="text-h1 text-foreground">Evening Shutdown</h1>
        <p className="text-sm text-muted-foreground">Close the loop, park tomorrow’s first move, and let the day be done.</p>
      </header>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="h-4 w-4 text-primary" />
          <h2 className="text-h3 text-foreground">Task Review</h2>
        </div>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks due or completed today.</p>
        ) : (
          <div className="space-y-2">
            {todayTasks.map(task => (
              <div key={task.id} className="rounded-lg border border-border px-3 py-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{task.title}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{task.status}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggle(task.id, 'completed')} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${completedTaskIds.includes(task.id) ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground'}`}>
                    {completedTaskIds.includes(task.id) ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}Completed
                  </button>
                  <button onClick={() => toggle(task.id, 'delayed')} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${delayedTaskIds.includes(task.id) ? 'bg-warning/10 text-warning' : 'bg-secondary text-muted-foreground'}`}>
                    {delayedTaskIds.includes(task.id) ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}Delayed
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Mood</Label>
            <Select value={String(mood)} onValueChange={(v) => setMood(Number(v) as Mood)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={String(v)}>{v}/5</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Energy</Label>
            <Select value={energy} onValueChange={(v) => setEnergy(v as EnergyLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>What went well?</Label>
          <Textarea value={wentWell} onChange={(e) => setWentWell(e.target.value)} placeholder="Wins, useful decisions, moments worth remembering..." />
        </div>
        <div>
          <Label>What should improve tomorrow?</Label>
          <Textarea value={improveTomorrow} onChange={(e) => setImproveTomorrow(e.target.value)} placeholder="A small adjustment for tomorrow..." />
        </div>
        <div>
          <Label>Tomorrow’s first task</Label>
          <Input value={tomorrowFirstTask} onChange={(e) => setTomorrowFirstTask(e.target.value)} placeholder="The first thing to do after opening LifeOS" />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary text-primary flex items-center justify-center"><Moon className="h-5 w-5" /></div>
          <div>
            <h2 className="text-h3 text-foreground">Shutdown complete?</h2>
            <p className="text-xs text-muted-foreground">This also refreshes today’s check-in signal for reviews.</p>
          </div>
        </div>
        <Button onClick={submit} disabled={saveShutdown.isPending} className="gradient-primary text-primary-foreground">
          Save and close day <Sunrise className="ml-2 h-4 w-4" />
        </Button>
      </section>
    </div>
  );
}
