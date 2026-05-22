import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { Activity, Timer, Target, Zap, TrendingUp, Compass, Flame, CheckSquare, Trophy } from 'lucide-react';
import { getTasks, getHabits, getGoals, getFocusSessions, getCheckIns } from '@/lib/store';
import { computeWeeklyStats, computeConsistency, lastNDates } from '@/lib/insights';
import { LIFE_AREAS } from '@/lib/life-areas';
import { SectionHeader, StatCard } from '@/components/app/patterns';
import { cn } from '@/lib/utils';

type Range = 'week' | 'month' | 'all';
const RANGE_LABEL: Record<Range, string> = { week: 'This week', month: 'This month', all: 'All time' };
const RANGE_DAYS: Record<Range, number> = { week: 7, month: 30, all: 365 };

const ACCENT = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

export default function Insights() {
  const tasks = getTasks();
  const habits = getHabits();
  const goals = getGoals();
  const sessions = getFocusSessions();
  const checkIns = getCheckIns();
  const [range, setRange] = useState<Range>('month');

  const weekly = useMemo(() => computeWeeklyStats(tasks, habits, goals, sessions), [tasks, habits, goals, sessions]);
  const consistency = useMemo(() => computeConsistency(habits, sessions, goals, checkIns), [habits, sessions, goals, checkIns]);

  // Headline stats (independent of range)
  const bestStreak = useMemo(() => habits.reduce((m, h) => Math.max(m, h.streak || 0), 0), [habits]);
  const goalsCompleted = useMemo(() => goals.filter(g => g.progress >= 100).length, [goals]);

  // Per-goal progress bars
  const goalProgressData = useMemo(
    () => goals.slice(0, 8).map(g => ({ name: g.title.length > 24 ? g.title.slice(0, 22) + '…' : g.title, progress: Math.round(g.progress) })),
    [goals],
  );

  // Task velocity (tasks completed per day) over selected range
  const velocityData = useMemo(() => {
    const n = RANGE_DAYS[range];
    const days = lastNDates(n);
    return days.map(d => ({
      date: d.slice(5),
      completed: tasks.filter(t => t.status === 'done' && t.createdAt.startsWith(d)).length,
    }));
  }, [tasks, range]);

  // Focus minutes per day over selected range
  const focusRangeData = useMemo(() => {
    const days = lastNDates(RANGE_DAYS[range]);
    return days.map(d => ({
      date: d.slice(5),
      minutes: sessions.filter(s => s.completedAt === d).reduce((sum, s) => sum + (s.duration || 0), 0),
    }));
  }, [sessions, range]);

  // 30-day completion-rate trend
  const trend30 = useMemo(() => {
    const days = lastNDates(30);
    return days.map(d => {
      const created = tasks.filter(t => t.createdAt.startsWith(d)).length;
      const done = tasks.filter(t => t.status === 'done' && t.createdAt.startsWith(d)).length;
      const focus = sessions.filter(s => s.completedAt === d).reduce((sum, s) => sum + (s.duration || 0), 0);
      const habitsHit = habits.reduce((n, h) => n + (h.completedDates?.includes(d) ? 1 : 0), 0);
      const possible = habits.filter(h => h.frequency === 'daily').length;
      return {
        date: d.slice(5),
        completion: created === 0 ? 0 : Math.round((done / created) * 100),
        focus,
        habitRate: possible === 0 ? 0 : Math.round((habitsHit / possible) * 100),
      };
    });
  }, [tasks, sessions, habits]);

  // Life area distribution (last 30 days, any activity)
  const areaData = useMemo(() => {
    const days = new Set(lastNDates(30));
    const counts = new Map<string, number>();
    tasks.filter(t => t.status === 'done' && days.has(t.createdAt.split('T')[0])).forEach(t => {
      if (t.lifeArea) counts.set(t.lifeArea, (counts.get(t.lifeArea) || 0) + 1);
    });
    habits.forEach(h => h.completedDates?.forEach(d => {
      if (days.has(d) && h.lifeArea) counts.set(h.lifeArea, (counts.get(h.lifeArea) || 0) + 1);
    }));
    return [...counts.entries()].map(([id, value]) => ({
      name: LIFE_AREAS.find(a => a.id === id)?.label || id,
      value,
    })).sort((a, b) => b.value - a.value);
  }, [tasks, habits]);

  // Goals on track vs behind
  const goalHealth = useMemo(() => {
    let onTrack = 0, behind = 0, completed = 0;
    const today = new Date();
    goals.forEach(g => {
      if (g.progress >= 100) { completed++; return; }
      if (g.targetDate) {
        const target = new Date(g.targetDate);
        const created = new Date(g.createdAt);
        const totalMs = target.getTime() - created.getTime();
        const elapsedMs = today.getTime() - created.getTime();
        const expected = totalMs <= 0 ? 100 : Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
        if (g.progress >= expected - 5) onTrack++; else behind++;
      } else {
        onTrack++;
      }
    });
    return [
      { name: 'On track', value: onTrack, fill: 'hsl(var(--success))' },
      { name: 'Behind', value: behind, fill: 'hsl(var(--warning))' },
      { name: 'Completed', value: completed, fill: 'hsl(var(--primary))' },
    ];
  }, [goals]);

  const focusByDay = weekly.byDay.map(d => ({ day: d.date.slice(5), minutes: d.focus }));
  const habitConsistencyDial = [{ name: 'Consistency', value: consistency.weeklyScore, fill: 'hsl(var(--primary))' }];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <p className="text-eyebrow">Productivity intelligence</p>
        <h1 className="text-h1 text-foreground">Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">Patterns in your last 7–30 days.</p>
      </header>

      {/* High-level stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Activity} label="Weekly score" value={`${consistency.weeklyScore}`} hint="0–100" accent="primary" />
        <StatCard icon={Timer} label="Focus hours" value={(weekly.focusMinutes / 60).toFixed(1)} hint={`${weekly.focusSessions} sessions`} accent="success" />
        <StatCard icon={Zap} label="Habit consistency" value={`${weekly.habitConsistency}%`} accent="warning" />
        <StatCard icon={Target} label="Goal momentum" value={`${consistency.goalMomentum}%`} hint="avg active" accent="primary" />
      </section>

      {/* Completion trend */}
      <Card title="Completion rate — 30 days" icon={TrendingUp} description="Share of tasks created each day that were also completed.">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={trend30} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="g-completion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip {...tooltipStyle()} formatter={(v: number) => [`${v}%`, 'Completion']} />
            <Area type="monotone" dataKey="completion" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#g-completion)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Focus this week */}
        <Card title="Focus minutes — this week" icon={Timer} description="Daily totals for the current week.">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={focusByDay} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle()} formatter={(v: number) => [`${v} min`, 'Focus']} />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Habit consistency dial */}
        <Card title="Habit consistency" icon={Zap} description="Blended score for habits + focus presence this week.">
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart innerRadius="60%" outerRadius="100%" data={habitConsistencyDial} startAngle={210} endAngle={-30}>
              <RadialBar dataKey="value" cornerRadius={12} background={{ fill: 'hsl(var(--secondary))' }} />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: 28, fontWeight: 700 }}>
                {consistency.weeklyScore}
              </text>
              <text x="50%" y="68%" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>weekly score</text>
            </RadialBarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Life area distribution */}
        <Card title="Most active life areas" icon={Compass} description="Where your effort landed in the last 30 days.">
          {areaData.length === 0 ? (
            <Empty label="No activity yet — complete tasks or habits to see your areas." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={areaData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={88} paddingAngle={3}>
                  {areaData.map((_, i) => <Cell key={i} fill={ACCENT[i % ACCENT.length]} />)}
                </Pie>
                <Tooltip {...tooltipStyle()} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Goals on track */}
        <Card title="Goals — on track vs behind" icon={Target} description="Behind = below expected pace by >5% based on time elapsed.">
          {goals.length === 0 ? (
            <Empty label="No goals yet." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={goalHealth} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip {...tooltipStyle()} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {goalHealth.map((g, i) => <Cell key={i} fill={g.fill as string} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Productivity trend (multi-line) */}
      <Card title="Productivity trend" icon={TrendingUp} description="Completion rate vs habit completion over 30 days.">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trend30} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip {...tooltipStyle()} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="completion" name="Tasks" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="habitRate" name="Habits" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function tooltipStyle() {
  return {
    contentStyle: {
      background: 'hsl(var(--popover))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 8,
      fontSize: 12,
      color: 'hsl(var(--popover-foreground))',
    },
    cursor: { fill: 'hsl(var(--secondary) / 0.5)' },
  };
}

function Card({ title, icon, description, children }: { title: string; icon: any; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <SectionHeader icon={icon} title={title} description={description} />
      {children}
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">{label}</div>;
}
