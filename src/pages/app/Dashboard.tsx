import { getTasks, getHabits, getGoals, getNotes, getFocusSessions, getProfile } from '@/lib/store';
import { CheckSquare, Zap, Target, BookOpen, Timer, TrendingUp, Calendar, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeIn = (delay: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.4 } });

export default function Dashboard() {
  const profile = getProfile();
  const tasks = getTasks();
  const habits = getHabits();
  const goals = getGoals();
  const notes = getNotes();
  const sessions = getFocusSessions();
  const today = new Date().toISOString().split('T')[0];

  const todayTasks = tasks.filter(t => t.dueDate === today || t.status === 'in-progress').slice(0, 4);
  const completedToday = tasks.filter(t => t.status === 'done').length;
  const activeHabits = habits.filter(h => h.frequency === 'daily').slice(0, 4);
  const todaySessions = sessions.filter(s => s.completedAt === today);

  const stats = [
    { label: 'Tasks done', value: completedToday, icon: CheckSquare, color: 'text-primary' },
    { label: 'Active habits', value: habits.length, icon: Zap, color: 'text-accent' },
    { label: 'Goals in progress', value: goals.length, icon: Target, color: 'text-warning' },
    { label: 'Focus sessions', value: todaySessions.length, icon: Timer, color: 'text-success' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div {...fadeIn(0)}>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.name || 'there'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your life system overview for today.</p>
      </motion.div>

      {/* Stats */}
      <motion.div {...fadeIn(0.1)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <motion.div {...fadeIn(0.2)}>
          <div className="rounded-xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Today's Tasks</h2>
              </div>
              <Link to="/app/tasks" className="text-sm text-primary hover:underline font-medium">View all</Link>
            </div>
            <div className="p-3">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No tasks for today. Enjoy your day! 🎉</div>
              ) : (
                todayTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary/50 transition-colors">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${task.status === 'done' ? 'bg-success' : task.status === 'in-progress' ? 'bg-warning' : 'bg-border'}`} />
                    <span className={`text-sm flex-1 ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-destructive/10 text-destructive' : task.priority === 'medium' ? 'bg-warning/10 text-warning' : 'bg-secondary text-muted-foreground'}`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Active Habits */}
        <motion.div {...fadeIn(0.3)}>
          <div className="rounded-xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                <h2 className="font-semibold text-foreground">Active Habits</h2>
              </div>
              <Link to="/app/habits" className="text-sm text-primary hover:underline font-medium">View all</Link>
            </div>
            <div className="p-3">
              {activeHabits.map(habit => (
                <div key={habit.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary/50 transition-colors">
                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${habit.completedDates.includes(today) ? 'border-accent bg-accent text-accent-foreground' : 'border-border'}`}>
                    {habit.completedDates.includes(today) && <CheckSquare className="h-3 w-3" />}
                  </div>
                  <span className="text-sm flex-1 text-foreground">{habit.title}</span>
                  <div className="flex items-center gap-1 text-xs text-warning">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{habit.streak}d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Goals Progress */}
        <motion.div {...fadeIn(0.4)}>
          <div className="rounded-xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-warning" />
                <h2 className="font-semibold text-foreground">Goals Progress</h2>
              </div>
              <Link to="/app/goals" className="text-sm text-primary hover:underline font-medium">View all</Link>
            </div>
            <div className="p-5 space-y-4">
              {goals.slice(0, 3).map(goal => (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{goal.title}</span>
                    <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full gradient-primary transition-all duration-500" style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Notes */}
        <motion.div {...fadeIn(0.5)}>
          <div className="rounded-xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-info" />
                <h2 className="font-semibold text-foreground">Recent Notes</h2>
              </div>
              <Link to="/app/notes" className="text-sm text-primary hover:underline font-medium">View all</Link>
            </div>
            <div className="p-3">
              {notes.filter(n => n.pinned).slice(0, 3).map(note => (
                <div key={note.id} className="rounded-lg px-3 py-2.5 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{note.title}</span>
                    <Star className="h-3 w-3 text-warning fill-current" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
