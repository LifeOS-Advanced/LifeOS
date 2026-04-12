import { useState } from 'react';
import { getHabits, setHabits } from '@/lib/store';
import { Habit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Star, Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Habits() {
  const [habits, setLocalHabits] = useState(getHabits());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', frequency: 'daily' as 'daily' | 'weekly' });
  const today = new Date().toISOString().split('T')[0];

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
    const newHabit: Habit = { id: `h${Date.now()}`, title: form.title, description: form.description, frequency: form.frequency, streak: 0, completedDates: [], createdAt: new Date().toISOString() };
    save([newHabit, ...habits]);
    setForm({ title: '', description: '', frequency: 'daily' });
    setDialogOpen(false);
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

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
              <div><Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v as 'daily' | 'weekly' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent>
                </Select>
              </div>
              <Button onClick={createHabit} className="w-full gradient-primary text-primary-foreground">Create Habit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="rounded-xl border border-border bg-card shadow-card text-center py-16">
            <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No habits yet. Start building your routine!</p>
          </div>
        ) : habits.map((habit, i) => (
          <motion.div
            key={habit.id}
            className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleToday(habit.id)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${habit.completedDates.includes(today) ? 'gradient-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent/20'}`}
                >
                  <Check className="h-4 w-4" />
                </button>
                <div>
                  <h3 className="font-semibold text-foreground">{habit.title}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{habit.frequency}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-warning">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-semibold">{habit.streak} day streak</span>
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
        ))}
      </div>
    </div>
  );
}
