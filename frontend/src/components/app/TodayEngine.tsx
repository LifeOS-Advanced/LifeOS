import { type ReactNode, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Sparkles, Star, Target, Timer, Zap, type LucideIcon } from 'lucide-react';
import { Task, Habit, Goal } from '@/lib/types';
import { LifeAreaBadge } from './LifeAreaBadge';
import { cn } from '@/lib/utils';

interface Props {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
}

const today = () => new Date().toISOString().split('T')[0];

export function TodayEngine({ tasks, habits, goals }: Props) {
  const t = today();

  const insights = useMemo(() => {
    const overdue = tasks.filter(x => x.status !== 'done' && x.dueDate && x.dueDate < t);
    const dueToday = tasks.filter(x => x.status !== 'done' && x.dueDate === t);
    const priorityRank = { high: 3, medium: 2, low: 1 } as const;
    const mit = [...dueToday, ...tasks.filter(x => x.status === 'in-progress' && !dueToday.includes(x))]
      .sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority])[0];

    const dailyHabits = habits.filter(h => h.frequency === 'daily');
    const habitsDue = dailyHabits.filter(h => !h.completedDates.includes(t));
    const habitsDoneToday = dailyHabits.filter(h => h.completedDates.includes(t));

    const goalNeedsAttention = [...goals]
      .filter(g => g.progress < 100)
      .sort((a, b) => {
        const aDate = a.targetDate ? new Date(a.targetDate).getTime() : Infinity;
        const bDate = b.targetDate ? new Date(b.targetDate).getTime() : Infinity;
        return (a.progress + (aDate / 1e10)) - (b.progress + (bDate / 1e10));
      })[0];

    const suggestedFocusTask = mit ?? (goalNeedsAttention
      ? tasks.find(x => goalNeedsAttention.linkedTaskIds.includes(x.id) && x.status !== 'done')
      : undefined);

    const quickWin = tasks.find(x => x.status !== 'done' && x.priority === 'low' && !x.dueDate);

    return { overdue, mit, habitsDue, habitsDoneToday, goalNeedsAttention, suggestedFocusTask, quickWin };
  }, [tasks, habits, goals, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-xl border border-border bg-card shadow-card"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative px-6 py-5 border-b border-border bg-gradient-to-br from-primary/5 via-card to-accent/5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="font-semibold text-foreground">Today's Plan</h2>
          </div>
          <span className="text-xs text-muted-foreground text-right">
            {new Date().toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        <div className="p-5 space-y-4">
          {insights.overdue.length > 0 && (
            <Row icon={AlertCircle} iconClass="text-destructive" label="Overdue">
              <p className="text-sm text-foreground">
                {insights.overdue.length} task{insights.overdue.length !== 1 && 's'} need attention
              </p>
              <div className="text-xs text-muted-foreground truncate">
                {insights.overdue.slice(0, 2).map(x => x.title).join(' - ')}
              </div>
            </Row>
          )}

          {insights.mit ? (
            <Row icon={Star} iconClass="text-warning" label="Most important task">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground">{insights.mit.title}</p>
                <LifeAreaBadge area={insights.mit.lifeArea} />
              </div>
              <p className="text-xs text-muted-foreground capitalize">{insights.mit.priority} priority</p>
            </Row>
          ) : (
            <Row icon={Star} iconClass="text-muted-foreground" label="Most important task">
              <p className="text-sm text-muted-foreground">Nothing scheduled - pick a focus.</p>
            </Row>
          )}

          <Row icon={Zap} iconClass="text-accent" label="Habits today">
            <p className="text-sm text-foreground">
              {insights.habitsDoneToday.length} done - {insights.habitsDue.length} remaining
            </p>
            {insights.habitsDue.length > 0 && (
              <p className="text-xs text-muted-foreground truncate">
                Next: {insights.habitsDue.slice(0, 3).map(h => h.title).join(' - ')}
              </p>
            )}
          </Row>
        </div>

        <div className="p-5 space-y-4">
          {insights.goalNeedsAttention && (
            <Row icon={Target} iconClass="text-primary" label="Goal needing attention">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground">{insights.goalNeedsAttention.title}</p>
                <LifeAreaBadge area={insights.goalNeedsAttention.lifeArea} />
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full gradient-primary" style={{ width: `${insights.goalNeedsAttention.progress}%` }} />
              </div>
            </Row>
          )}

          {insights.suggestedFocusTask && (
            <Row icon={Timer} iconClass="text-success" label="Suggested focus session">
              <p className="text-sm text-foreground">25 min on "{insights.suggestedFocusTask.title}"</p>
              <Link to="/app/focus" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                Start session <ArrowRight className="h-3 w-3" />
              </Link>
            </Row>
          )}

          {insights.quickWin && (
            <Row icon={Sparkles} iconClass="text-accent" label="Quick win">
              <p className="text-sm text-foreground">{insights.quickWin.title}</p>
              <p className="text-xs text-muted-foreground">Low effort - knock it out fast</p>
            </Row>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Row({ icon: Icon, iconClass, label, children }: { icon: LucideIcon; iconClass: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn('mt-0.5 h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 ring-1 ring-border/50', iconClass)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}
