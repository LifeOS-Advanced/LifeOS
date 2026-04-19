import { useState } from 'react';
import { getHabits, setHabits, getGoals } from '@/lib/store';
import { Habit, LifeArea } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Star, Check, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { LifeAreaBadge } from '@/components/app/LifeAreaBadge';
import { LifeAreaSelect } from '@/components/app/LifeAreaSelect';
import { LifeAreaFilter } from '@/components/app/LifeAreaFilter';
import { EmptyState } from '@/components/app/EmptyState';
import { useNewParam } from '@/hooks/use-new-param';

export default function Habits() {
  const goals = getGoals();
  const [habits, setLocalHabits] = useState(getHabits());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [areaFilter, setAreaFilter] = useState<LifeArea | 'all'>('all');
  const [form, setForm] = useState<{ title: string; description: string; frequency: 'daily' | 'weekly'; lifeArea?: LifeArea; goalId?: string }>({ title: '', description: '', frequency: 'daily' });
  const today = new Date().toISOString().split('T')[0];

  useNewParam(() => setDialogOpen(true));

  const save = (updated: Habit[]) => { setLocalHabits(updated); setHabits(updated); };

  const toggleToday = (id: string) => {
    save(habits.map(h => {
      if (h.id !== id) return h;
      const done = h.completedDates.includes(today);
      return {
        ...h,
        completedDates: done ? h.completedDates.filter(d => d !== today) : [...h.completedDates, today],
        streak: done ? Math.max(0, h.streak - 1) : h.streak + 1,
      };
    }));
  };

  const createHabit = () => {
    if (!form.title.trim()) return;
    const newHabit: Habit = { id: `h${Date.now()}`, title: form.title, description: form.description, frequency: form.frequency, streak: 0, completedDates: [], lifeArea: form.lifeArea, goalId: form.goalId, createdAt: new Date().toISOString() };
    save([newHabit, ...habits]);
    setForm({ title: '', description: '', frequency: 'daily' });
    setDialogOpen(false);
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const visible = habits.filter(h => areaFilter === 'all' || h.lifeArea === areaFilter);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
              <Button onClick={createHabit} className="w-full gradient-primary text-primary-foreground">Create Habit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <LifeAreaFilter value={areaFilter} onChange={setAreaFilter} />

      <div className="space-y-4">
        {habits.length === 0 ? (
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
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${habit.completedDates.includes(today) ? 'gradient-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent/20'}`}
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
                <div className="flex items-center gap-1.5 text-warning shrink-0">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-semibold">{habit.streak}d</span>
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
