import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getTasks, getGoals, getHabits, setTasks } from '@/lib/store';
import { CalendarDays, CheckSquare, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type FilterKey = 'tasks' | 'goals' | 'habits';

export default function CalendarPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({ tasks: true, goals: true, habits: true });
  const [tasks, setLocalTasks] = useState(getTasks());
  const goals = getGoals();
  const habits = getHabits();

  const toggle = (k: FilterKey) => setFilters(f => ({ ...f, [k]: !f[k] }));

  const events = useMemo(() => {
    const ev: EventInput[] = [];
    if (filters.tasks) {
      tasks.filter(t => t.dueDate).forEach(t => {
        ev.push({
          id: `t-${t.id}`,
          title: t.title,
          start: t.dueDate,
          allDay: true,
          extendedProps: { kind: 'task', priority: t.priority, status: t.status, taskId: t.id },
          classNames: ['fc-evt-task', t.status === 'done' ? 'fc-evt-done' : ''],
        });
      });
    }
    if (filters.goals) {
      goals.filter(g => g.targetDate).forEach(g => {
        ev.push({
          id: `g-${g.id}`,
          title: `🎯 ${g.title}`,
          start: g.targetDate,
          allDay: true,
          extendedProps: { kind: 'goal' },
          classNames: ['fc-evt-goal'],
        });
      });
    }
    if (filters.habits) {
      // Plot habit completions over the visible window — last 60 days for context
      const today = new Date();
      const start = new Date(); start.setDate(today.getDate() - 60);
      habits.forEach(h => {
        h.completedDates.forEach(d => {
          ev.push({
            id: `h-${h.id}-${d}`,
            title: `⚡ ${h.title}`,
            start: d,
            allDay: true,
            extendedProps: { kind: 'habit' },
            classNames: ['fc-evt-habit'],
          });
        });
      });
    }
    return ev;
  }, [tasks, goals, habits, filters]);

  const handleDrop = (info: EventDropArg) => {
    const props = info.event.extendedProps;
    if (props.kind !== 'task') { info.revert(); return; }
    const newDate = info.event.startStr;
    const updated = tasks.map(t => t.id === props.taskId ? { ...t, dueDate: newDate } : t);
    setLocalTasks(updated); setTasks(updated);
    toast.success('Task rescheduled', { description: newDate });
  };

  const handleClick = (info: EventClickArg) => {
    const k = info.event.extendedProps.kind;
    if (k === 'task') navigate('/app/tasks');
    if (k === 'goal') navigate('/app/goals');
    if (k === 'habit') navigate('/app/habits');
  };

  const chipCls = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-transparent hover:text-foreground'}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><CalendarDays className="h-6 w-6" />Calendar</h1>
          <p className="text-muted-foreground text-sm">Tasks, goals and habits at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={chipCls(filters.tasks)} onClick={() => toggle('tasks')}><CheckSquare className="h-3.5 w-3.5" />Tasks</button>
          <button className={chipCls(filters.goals)} onClick={() => toggle('goals')}><Target className="h-3.5 w-3.5" />Goals</button>
          <button className={chipCls(filters.habits)} onClick={() => toggle('habits')}><Zap className="h-3.5 w-3.5" />Habits</button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card p-4 lifeos-calendar">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }}
          height="auto"
          editable
          droppable
          events={events}
          eventDrop={handleDrop}
          eventClick={handleClick}
          dayMaxEvents={3}
        />
      </div>
    </div>
  );
}
