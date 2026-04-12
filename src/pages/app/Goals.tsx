import { useState } from 'react';
import { getGoals, setGoals, getTasks, getHabits } from '@/lib/store';
import { Goal, Milestone } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Target, CheckCircle2, Circle, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Goals() {
  const [goals, setLocalGoals] = useState(getGoals());
  const tasks = getTasks();
  const habits = getHabits();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', targetDate: '' });

  const save = (updated: Goal[]) => { setLocalGoals(updated); setGoals(updated); };

  const createGoal = () => {
    if (!form.title.trim()) return;
    const newGoal: Goal = { id: `g${Date.now()}`, title: form.title, description: form.description, targetDate: form.targetDate, progress: 0, milestones: [], linkedTaskIds: [], linkedHabitIds: [], createdAt: new Date().toISOString() };
    save([newGoal, ...goals]);
    setForm({ title: '', description: '', targetDate: '' });
    setDialogOpen(false);
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    save(goals.map(g => {
      if (g.id !== goalId) return g;
      const updated = g.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
      const progress = updated.length ? Math.round((updated.filter(m => m.completed).length / updated.length) * 100) : g.progress;
      return { ...g, milestones: updated, progress };
    }));
  };

  const addMilestone = (goalId: string, title: string) => {
    if (!title.trim()) return;
    save(goals.map(g => g.id === goalId ? { ...g, milestones: [...g.milestones, { id: `m${Date.now()}`, title, completed: false }] } : g));
  };

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
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Launch personal brand" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What do you want to achieve?" /></div>
              <div><Label>Target Date</Label><Input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} /></div>
              <Button onClick={createGoal} className="w-full gradient-primary text-primary-foreground">Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card text-center py-16">
          <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No goals yet. Set your first goal!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {goals.map((goal, i) => {
            const linkedTasks = tasks.filter(t => goal.linkedTaskIds.includes(t.id));
            const linkedHabits = habits.filter(h => goal.linkedHabitIds.includes(h.id));

            return (
              <motion.div
                key={goal.id}
                className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{goal.title}</h3>
                      {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
                    </div>
                    {goal.targetDate && <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">{goal.targetDate}</span>}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Progress</span>
                      <span className="text-sm font-semibold text-primary">{goal.progress}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full gradient-primary transition-all duration-500" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>

                  {/* Milestones */}
                  {goal.milestones.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-semibold text-foreground">Milestones</h4>
                      {goal.milestones.map(m => (
                        <button key={m.id} onClick={() => toggleMilestone(goal.id, m.id)} className="flex items-center gap-2 w-full text-left py-1 hover:bg-secondary/50 rounded px-2 transition-colors">
                          {m.completed ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> : <Circle className="h-4 w-4 text-border shrink-0" />}
                          <span className={`text-sm ${m.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{m.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Add Milestone */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add milestone..."
                      className="text-sm"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          addMilestone(goal.id, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>

                  {/* Linked items */}
                  {(linkedTasks.length > 0 || linkedHabits.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        {linkedTasks.length > 0 && <span>{linkedTasks.length} linked task{linkedTasks.length !== 1 && 's'}</span>}
                        {linkedHabits.length > 0 && <span>· {linkedHabits.length} linked habit{linkedHabits.length !== 1 && 's'}</span>}
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
