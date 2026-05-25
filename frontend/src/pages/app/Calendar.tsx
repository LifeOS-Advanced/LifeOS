import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarDays, CheckSquare, Target, Zap, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useFocusSessions, useGoals, useHabits, useTasks, useUpdateTask } from '@/lib/queries';

type FilterKey = 'tasks' | 'goals' | 'habits' | 'focus';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { data: tasks = [] } = useTasks();
  const { data: goals = [] } = useGoals();
  const { data: habits = [] } = useHabits();
  const { data: sessions = [] } = useFocusSessions();
  const updateTask = useUpdateTask();
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({ tasks: true, goals: true, habits: true, focus: false });

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
    if (filters.focus) {
      sessions.forEach(s => {
        ev.push({
          id: `f-${s.id}`,
          title: `🎯 ${s.label || 'Focus'}`,
          start: s.completedAt,
          allDay: true,
          extendedProps: { kind: 'focus' },
          classNames: ['fc-evt-focus'],
        });
      });
    }
    return ev;
  }, [tasks, goals, habits, sessions, filters]);

  const handleDrop = async (info: EventDropArg) => {
    const props = info.event.extendedProps;
    if (props.kind !== 'task') { info.revert(); return; }
    const newDate = info.event.startStr;
    try {
      await updateTask.mutateAsync({ id: props.taskId as string, updates: { dueDate: newDate } });
      toast.success('Task rescheduled', { description: newDate });
    } catch {
      info.revert();
      toast.error('Could not reschedule task');
    }
  };

  const handleClick = (info: EventClickArg) => {
    const k = info.event.extendedProps.kind;
    if (k === 'task') navigate('/app/tasks');
    if (k === 'goal') navigate('/app/goals');
    if (k === 'habit') navigate('/app/habits');
    if (k === 'focus') navigate('/app/focus');
  };

  const chipCls = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-transparent hover:text-foreground'}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><CalendarDays className="h-6 w-6" />Calendar</h1>
          <p className="text-muted-foreground text-sm">Tasks, goals, habits, and focus at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={chipCls(filters.tasks)} onClick={() => toggle('tasks')}><CheckSquare className="h-3.5 w-3.5" />Tasks</button>
          <button className={chipCls(filters.goals)} onClick={() => toggle('goals')}><Target className="h-3.5 w-3.5" />Goals</button>
          <button className={chipCls(filters.habits)} onClick={() => toggle('habits')}><Zap className="h-3.5 w-3.5" />Habits</button>
          <button className={chipCls(filters.focus)} onClick={() => toggle('focus')}><Timer className="h-3.5 w-3.5" />Focus</button>
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
