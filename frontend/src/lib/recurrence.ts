import { Task } from './types';
import { dataLayer } from './data-layer';

const ymd = (d: Date) => d.toISOString().split('T')[0];
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

function nextOccurrence(from: Date, rule: NonNullable<Task['recurrence']>): Date | null {
  const next = new Date(from);
  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      return next;
    case 'weekly': {
      const days = rule.daysOfWeek && rule.daysOfWeek.length ? rule.daysOfWeek : [from.getDay()];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(from);
        d.setDate(from.getDate() + i);
        if (days.includes(d.getDay())) return d;
      }
      return null;
    }
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      return next;
    default:
      return null;
  }
}

/**
 * Generates pending recurring task instances up to today (local calendar day).
 */
export async function generateRecurringInstances(): Promise<boolean> {
  const tasks = await dataLayer.listTasks();
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayStr = ymd(today);
  let mutated = false;

  for (const t of tasks) {
    if (!t.recurrence || t.recurrence.frequency === 'none') continue;
    if (t.recurrenceParentId) continue;
    const anchor = t.lastGeneratedDate || t.dueDate;
    if (!anchor) continue;

    let cursor = parse(anchor);
    cursor.setHours(12, 0, 0, 0);
    let safety = 0;
    let lastCursorStr = t.lastGeneratedDate || anchor;

    while (safety++ < 200) {
      const next = nextOccurrence(cursor, t.recurrence);
      if (!next || next > today) break;
      next.setHours(12, 0, 0, 0);
      const nextStr = ymd(next);
      const exists = tasks.some(x => x.recurrenceParentId === t.id && x.dueDate === nextStr);
      if (!exists) {
        await dataLayer.createTask({
          title: t.title,
          description: t.description,
          status: 'todo',
          priority: t.priority,
          importance: t.importance,
          urgency: t.urgency,
          effort: t.effort,
          energyRequired: t.energyRequired,
          dueDate: nextStr,
          tags: [...(t.tags ?? [])],
          goalId: t.goalId,
          lifeArea: t.lifeArea,
          subtasks: t.subtasks?.map(s => ({ title: s.title, done: false })),
          recurrence: { frequency: 'none' },
          recurrenceParentId: t.id,
        });
        mutated = true;
      }
      cursor = next;
      lastCursorStr = nextStr;
    }

    if (lastCursorStr !== (t.lastGeneratedDate || '')) {
      await dataLayer.updateTask(t.id, { lastGeneratedDate: lastCursorStr });
      mutated = true;
    }
  }

  return mutated;
}
