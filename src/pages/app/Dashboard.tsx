import { useEffect, useState } from 'react';
import { getTasks, getHabits, getGoals, getNotes, getFocusSessions, getProfile, getCheckIns } from '@/lib/store';
import { CheckSquare, Zap, Target, BookOpen, Timer, TrendingUp, Star, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TodayEngine } from '@/components/app/TodayEngine';
import { LifeAreaBadge } from '@/components/app/LifeAreaBadge';
import { ConsistencyCard } from '@/components/app/ConsistencyCard';
import { DashboardSkeleton } from '@/components/app/DashboardSkeleton';
import { computeConsistency } from '@/lib/insights';

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Dashboard() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Tiny perceived-loading delay so the skeleton states are felt, then content.
    const t = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <DashboardSkeleton />;

  const profile = getProfile();
  const tasks = getTasks();
  const habits = getHabits();
  const goals = getGoals();
  const notes = getNotes();
  const sessions = getFocusSessions();
  const checkIns = getCheckIns();
  const today = new Date().toISOString().split('T')[0];

  const completedToday = tasks.filter(t => t.status === 'done').length;
  const todaySessions = sessions.filter(s => s.completedAt === today);
  const consistency = computeConsistency(habits, sessions, goals, checkIns);
  const todayCheckIn = checkIns.find(c => c.date === today);

  const baseStats = [
    { key: 'tasks', label: 'Tasks done', value: completedToday, icon: CheckSquare, color: 'text-primary' },
    { key: 'habits', label: 'Active habits', value: habits.length, icon: Zap, color: 'text-accent' },
    { key: 'goals', label: 'Goals in progress', value: goals.length, icon: Target, color: 'text-warning' },
    { key: 'focus', label: 'Focus sessions', value: todaySessions.length, icon: Timer, color: 'text-success' },
  ];
  const priority = profile?.dashboardPriority;
  const stats = priority
    ? [...baseStats].sort((a, b) => (a.key === priority ? -1 : b.key === priority ? 1 : 0))
    : baseStats;

  const connectedGoal = [...goals].sort((a, b) => {
    const aCount = (tasks.filter(t => a.linkedTaskIds.includes(t.id) || t.goalId === a.id).length)
      + (habits.filter(h => a.linkedHabitIds.includes(h.id) || h.goalId === a.id).length)
      + (notes.filter(n => a.linkedNoteIds.includes(n.id) || n.goalId === a.id).length);
    const bCount = (tasks.filter(t => b.linkedTaskIds.includes(t.id) || t.goalId === b.id).length)
      + (habits.filter(h => b.linkedHabitIds.includes(h.id) || h.goalId === b.id).length)
      + (notes.filter(n => b.linkedNoteIds.includes(n.id) || n.goalId === b.id).length);
    return bCount - aCount;
  })[0];

  const goalTasks = connectedGoal ? tasks.filter(t => connectedGoal.linkedTaskIds.includes(t.id) || t.goalId === connectedGoal.id) : [];
  const goalHabits = connectedGoal ? habits.filter(h => connectedGoal.linkedHabitIds.includes(h.id) || h.goalId === connectedGoal.id) : [];
  const goalNotes = connectedGoal ? notes.filter(n => connectedGoal.linkedNoteIds.includes(n.id) || n.goalId === connectedGoal.id) : [];

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero header — strongest single element on the screen */}
      <motion.header {...fadeIn(0)} className="space-y-2">
        <p className="text-eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="text-h1 text-foreground">
          {greeting}, {profile?.name?.split(' ')[0] || 'there'}.
        </h1>
        {todayCheckIn ? (
          <p className="text-sm text-muted-foreground">
            Today's focus: <span className="text-foreground font-medium">{todayCheckIn.mainFocus || todayCheckIn.oneWord || '—'}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Here's your life system overview for today.</p>
        )}
      </motion.header>

      {/* Row 1 — HERO: Today's plan dominates */}
      <motion.section {...fadeIn(0.05)}>
        <TodayEngine tasks={tasks} habits={habits} goals={goals} />
      </motion.section>

      {/* Row 2 — Supporting stats (lower emphasis, sunken surface) */}
      <motion.section {...fadeIn(0.1)} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div
            key={s.label}
            className="rounded-xl border border-subtle surface-sunken p-4 transition-all duration-200 hover:border-border hover:bg-card"
          >
            <div className="flex items-center justify-between mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <TrendingUp className="h-3.5 w-3.5 text-success/70" />
            </div>
            <p className="text-2xl font-semibold text-foreground tabular-nums leading-none mt-2">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </motion.section>

      {/* Row 3 — Consistency & connected goal side-by-side on wide screens */}
      <motion.section {...fadeIn(0.15)} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {connectedGoal ? (
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden h-full">
              <div className="px-5 py-4 border-b border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <h2 className="text-h3 text-foreground">Connected Goal</h2>
                </div>
                <Link to="/app/goals" className="text-xs text-primary hover:underline font-medium">View all</Link>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-foreground truncate">{connectedGoal.title}</h3>
                      <LifeAreaBadge area={connectedGoal.lifeArea} />
                    </div>
                    {connectedGoal.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{connectedGoal.description}</p>}
                  </div>
                  <span className="text-sm font-semibold text-primary shrink-0 tabular-nums">{connectedGoal.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-5">
                  <motion.div
                    className="h-full rounded-full gradient-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${connectedGoal.progress}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <ConnectedColumn icon={CheckSquare} label="Tasks" accent="text-primary" items={goalTasks.map(t => ({ id: t.id, title: t.title, meta: t.status }))} />
                  <ConnectedColumn icon={Zap} label="Habits" accent="text-accent" items={goalHabits.map(h => ({ id: h.id, title: h.title, meta: `${h.streak}d streak` }))} />
                  <ConnectedColumn icon={BookOpen} label="Notes" accent="text-info" items={goalNotes.map(n => ({ id: n.id, title: n.title }))} />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No goals yet — create one to see connections.</p>
            </div>
          )}
        </div>

        <div>
          <ConsistencyCard stats={consistency} />
        </div>
      </motion.section>

      {/* Row 4 — Pinned notes (lowest emphasis) */}
      <motion.section {...fadeIn(0.2)} className="rounded-xl border border-subtle bg-card/60">
        <div className="flex items-center justify-between px-5 py-4 border-b border-subtle">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-info" />
            <h2 className="text-h3 text-foreground">Pinned Notes</h2>
          </div>
          <Link to="/app/notes" className="text-xs text-primary hover:underline font-medium">View all</Link>
        </div>
        <div className="p-3">
          {notes.filter(n => n.pinned).length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No pinned notes yet.</div>
          ) : notes.filter(n => n.pinned).slice(0, 3).map(note => (
            <div key={note.id} className="rounded-lg px-3 py-2.5 hover:bg-secondary/50 transition-colors duration-200">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-medium text-foreground">{note.title}</span>
                <Star className="h-3 w-3 text-warning fill-current" />
                <LifeAreaBadge area={note.lifeArea} />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{note.content}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

function ConnectedColumn({ icon: Icon, label, accent, items }: { icon: any; label: string; accent: string; items: { id: string; title: string; meta?: string }[] }) {
  return (
    <div className="rounded-lg surface-sunken p-3">
      <div className={`flex items-center gap-1.5 text-xs font-semibold mb-2 ${accent}`}>
        <Icon className="h-3.5 w-3.5" />
        {label} ({items.length})
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">None linked yet</p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 4).map(it => (
            <li key={it.id} className="text-xs text-foreground">
              <span className="truncate block">· {it.title}</span>
              {it.meta && <span className="text-[10px] text-muted-foreground ml-2 capitalize">{it.meta}</span>}
            </li>
          ))}
          {items.length > 4 && <li className="text-xs text-muted-foreground">+{items.length - 4} more</li>}
        </ul>
      )}
    </div>
  );
}
