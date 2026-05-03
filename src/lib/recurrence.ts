import { Task } from './types';
import { getTasks, setTasks } from './store';

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
 * Generates pending recurring task instances up to today.
 * For each template task with a recurrence rule, ensures an occurrence exists
 * for each scheduled date between lastGeneratedDate (or dueDate) and today.
 */
export function generateRecurringInstances(): boolean {
  const tasks = getTasks();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = ymd(today);
  let mutated = false;
  const additions: Task[] = [];

  for (const t of tasks) {
    if (!t.recurrence || t.recurrence.frequency === 'none') continue;
    if (t.recurrenceParentId) continue; // skip instances
    const anchor = t.lastGeneratedDate || t.dueDate;
    if (!anchor) continue;
    let cursor = parse(anchor);
    let safety = 0;
    while (safety++ < 200) {
      const next = nextOccurrence(cursor, t.recurrence);
      if (!next || next > today) break;
      const nextStr = ymd(next);
      const exists = tasks.some(x => x.recurrenceParentId === t.id && x.dueDate === nextStr)
        || additions.some(x => x.recurrenceParentId === t.id && x.dueDate === nextStr);
      if (!exists) {
        additions.push({
          id: `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
          title: t.title,
          description: t.description,
          status: 'todo',
          priority: t.priority,
          dueDate: nextStr,
          tags: [...t.tags],
          goalId: t.goalId,
          lifeArea: t.lifeArea,
          subtasks: t.subtasks?.map(s => ({ ...s, id: `s${Date.now()}${Math.random().toString(36).slice(2, 5)}`, done: false })),
          recurrenceParentId: t.id,
          createdAt: new Date().toISOString(),
        });
        mutated = true;
      }
      cursor = next;
    }
    if (cursor && ymd(cursor) !== (t.lastGeneratedDate || '')) {
      t.lastGeneratedDate = ymd(cursor);
      mutated = true;
    }
    // If next scheduled is in the future, set lastGeneratedDate to today's anchor
    if (!t.lastGeneratedDate || t.lastGeneratedDate < todayStr) {
      // Already updated above for cursor; nothing more
    }
  }

  if (mutated) setTasks([...additions, ...tasks]);
  return mutated;
}
