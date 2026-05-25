import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Goal, LifeArea } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Target, CheckCircle2, Circle, CheckSquare, Zap, BookOpen, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { LifeAreaBadge } from '@/components/app/LifeAreaBadge';
import { LifeAreaSelect } from '@/components/app/LifeAreaSelect';
import { LifeAreaFilter } from '@/components/app/LifeAreaFilter';
import { EmptyState } from '@/components/app/EmptyState';
import { GoalIntelligence } from '@/components/app/GoalIntelligence';
import { useNewParam } from '@/hooks/use-new-param';
import { goalFormSchema, validateOrToast } from '@/lib/schemas';
import {
  useAddGoalMilestone,
  useCreateGoal,
  useGoals,
  useHabits,
  useNotes,
  useTasks,
  useToggleGoalMilestone,
} from '@/lib/queries';

export default function Goals() {
  const { data: goals = [], isLoading } = useGoals();
  const { data: tasks = [] } = useTasks();
  const { data: habits = [] } = useHabits();
  const { data: notes = [] } = useNotes();
  const createGoal = useCreateGoal();
  const toggleMilestone = useToggleGoalMilestone();
  const addMilestone = useAddGoalMilestone();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [areaFilter, setAreaFilter] = useState<LifeArea | 'all'>('all');
  const [form, setForm] = useState<{ title: string; description: string; targetDate: string; lifeArea?: LifeArea }>({ title: '', description: '', targetDate: '' });

  useNewParam(() => setDialogOpen(true));

  const handleCreate = async () => {
    const valid = validateOrToast(goalFormSchema, { title: form.title, description: form.description, targetDate: form.targetDate });
    if (!valid) return;
    try {
      await createGoal.mutateAsync({
        title: form.title,
        description: form.description,
        targetDate: form.targetDate,
        lifeArea: form.lifeArea,
      });
      setForm({ title: '', description: '', targetDate: '' });
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create goal');
    }
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string, prevProgress: number) => {
    try {
      const updated = await toggleMilestone.mutateAsync({ goalId, milestoneId });
      if (updated.progress === 100 && prevProgress !== 100) {
        toast.success('Goal complete!', { description: updated.title });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update milestone');
    }
  };

  const handleAddMilestone = async (goalId: string, title: string) => {
    if (!title.trim()) return;
    try {
      await addMilestone.mutateAsync({ goalId, title: title.trim() });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add milestone');
    }
  };

  const visible = goals.filter(g => areaFilter === 'all' || g.lifeArea === areaFilter);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-secondary rounded" />
        <div className="h-32 bg-secondary rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Goals</h1>
          <p className="text-muted-foreground text-sm">Set ambitious goals and track your progress.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90"><Plus className="h-4 w-4 mr-2" />New Goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Goal</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Get fit in 90 days" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What do you want to achieve?" /></div>
              <div><Label>Life Area</Label><LifeAreaSelect value={form.lifeArea} onChange={v => setForm({ ...form, lifeArea: v })} /></div>
              <div><Label>Target Date</Label><Input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} /></div>
              <Button onClick={handleCreate} disabled={createGoal.isPending} className="w-full gradient-primary text-primary-foreground">Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <LifeAreaFilter value={areaFilter} onChange={setAreaFilter} />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Goals turn vague wishes into actual plans. Define one and start aiming."
          ctaLabel="Create Goal"
          onCta={() => setDialogOpen(true)}
          tip="Link tasks and habits to a goal so progress feels real."
        />
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card text-center py-16">
          <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No goals in this life area yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {visible.map((goal, i) => {
            const linkedTasks = tasks.filter(t => goal.linkedTaskIds.includes(t.id) || t.goalId === goal.id);
            const linkedHabits = habits.filter(h => goal.linkedHabitIds.includes(h.id) || h.goalId === goal.id);
            const linkedNotes = notes.filter(n => goal.linkedNoteIds.includes(n.id) || n.goalId === goal.id);

            return (
              <motion.div
                key={goal.id}
                className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-bold text-foreground">{goal.title}</h3>
                        <LifeAreaBadge area={goal.lifeArea} />
                      </div>
                      {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
                    </div>
                    {goal.targetDate && <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full whitespace-nowrap">{goal.targetDate}</span>}
                  </div>

                  <GoalIntelligence goal={goal} linkedTasks={linkedTasks} linkedHabits={linkedHabits} goalId={goal.id} />

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Progress</span>
                      <span className="text-sm font-semibold text-primary">{goal.progress}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full gradient-primary transition-all duration-500" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>

                  {goal.milestones.length > 0 && (
                    <div className="space-y-1 mb-4">
                      <h4 className="text-sm font-semibold text-foreground mb-2">Milestones</h4>
                      {goal.milestones.map(m => (
                        <button
                          key={m.id}
                          onClick={() => handleToggleMilestone(goal.id, m.id, goal.progress)}
                          className="flex items-center gap-2 w-full text-left py-1 hover:bg-secondary/50 rounded px-2 transition-colors"
                        >
                          {m.completed ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> : <Circle className="h-4 w-4 text-border shrink-0" />}
                          <span className={`text-sm ${m.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{m.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Add milestone..."
                      className="text-sm"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleAddMilestone(goal.id, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>

                  {(linkedTasks.length > 0 || linkedHabits.length > 0 || linkedNotes.length > 0) && (
                    <div className="pt-4 border-t border-border space-y-3">
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Connected to this goal</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <LinkedGroup icon={CheckSquare} label="Tasks" items={linkedTasks.map(x => x.title)} accent="text-primary" href={`/app/tasks?goalId=${goal.id}`} />
                        <LinkedGroup icon={Zap} label="Habits" items={linkedHabits.map(x => x.title)} accent="text-accent" href={`/app/habits?goalId=${goal.id}`} />
                        <LinkedGroup icon={BookOpen} label="Notes" items={linkedNotes.map(x => x.title)} accent="text-info" href={`/app/notes?goalId=${goal.id}`} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LinkedGroup({ icon: Icon, label, items, accent, href }: { icon: LucideIcon; label: string; items: string[]; accent: string; href: string }) {
  return (
    <Link to={href} className="rounded-lg bg-secondary/40 p-3 hover:bg-secondary/60 transition-colors block">
      <div className={`flex items-center gap-1.5 text-xs font-semibold mb-2 ${accent}`}>
        <Icon className="h-3.5 w-3.5" />
        {label} ({items.length})
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">None linked</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 3).map(t => <li key={t} className="text-xs text-foreground truncate">· {t}</li>)}
          {items.length > 3 && <li className="text-xs text-muted-foreground">+{items.length - 3} more</li>}
        </ul>
      )}
    </Link>
  );
}
