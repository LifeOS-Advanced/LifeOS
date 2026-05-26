/**
 * Data layer abstraction. Currently backed by localStorage via store.ts.
 * Swap implementations here when migrating to a real API — call sites
 * (React Query hooks) won't change.
 */
import * as store from './store';
import { api, getToken } from './api';
import type {
  Task, Habit, Goal, Note, FocusSession, UserProfile, Subtask, Milestone,
  DailyStart, EveningShutdown, SearchResults, LifeMomentum, UserProgress, RewardEventInput,
  WeeklyReview, WeeklyNarrativeRecap, DisciplineTarget, ReplacementAction, UrgeLog, DisciplineInsights,
} from './types';
import { DEFAULT_PREFERENCES } from './types';
import { computeLifeMomentum } from './insights';
import { buildWeeklyNarrative } from './identity';
import { getLocalProgress, recordLocalProgressEvent } from './progress';

const delay = <T,>(v: T) => Promise.resolve(v);

type ApiSubtask = Omit<Subtask, 'id'> & { _id?: string; id?: string };
type ApiTask = Omit<Task, 'id' | 'subtasks'> & {
  _id?: string;
  id?: string;
  subtasks?: ApiSubtask[];
};
type ApiHabit = Omit<Habit, 'id'> & { _id?: string; id?: string };
type ApiMilestone = Omit<Milestone, 'id'> & { _id?: string; id?: string };
type ApiGoal = Omit<Goal, 'id' | 'milestones' | 'linkedTaskIds' | 'linkedHabitIds' | 'linkedNoteIds' | 'createdAt'> & {
  _id?: string;
  id?: string;
  milestones?: ApiMilestone[];
  linkedTaskIds?: string[];
  linkedHabitIds?: string[];
  linkedNoteIds?: string[];
  createdAt?: string;
};
type ApiNote = Omit<Note, 'id' | 'createdAt' | 'updatedAt'> & {
  _id?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};
type ApiUser = {
  name: string;
  email: string;
  lifestyleMode?: UserProfile['lifestyleMode'];
  enabledModules?: UserProfile['enabledModules'];
  theme?: UserProfile['theme'];
  improvementFocus?: UserProfile['improvementFocus'];
  dayIntensity?: UserProfile['dayIntensity'];
  dashboardPriority?: UserProfile['dashboardPriority'];
  preferences?: UserProfile['preferences'];
};
type ApiDailyStart = Omit<DailyStart, 'id'> & { _id?: string; id?: string };
type ApiEveningShutdown = Omit<EveningShutdown, 'id'> & { _id?: string; id?: string };
type ApiDisciplineTarget = Omit<DisciplineTarget, 'id'> & { _id?: string; id?: string };
type ApiReplacementAction = Omit<ReplacementAction, 'id'> & { _id?: string; id?: string };
type ApiUrgeLog = Omit<UrgeLog, 'id'> & { _id?: string; id?: string };
type DisciplineTargetPayload = Omit<DisciplineTarget, 'id' | 'createdAt' | 'updatedAt'>;
type ReplacementActionPayload = Omit<ReplacementAction, 'id' | 'createdAt' | 'updatedAt'>;
type UrgeLogPayload = Omit<UrgeLog, 'id' | 'createdAt' | 'updatedAt'>;

type TaskPayload = Omit<Task, 'id' | 'createdAt'> & Partial<Pick<Task, 'createdAt'>>;
type HabitPayload = Omit<Habit, 'id' | 'createdAt' | 'streak' | 'completedDates'> & Partial<Pick<Habit, 'streak' | 'completedDates' | 'createdAt'>>;
const flowKeys = {
  dailyStart: 'lifeos_daily_start',
  eveningShutdown: 'lifeos_evening_shutdown',
};
const DEFAULT_MODULES: UserProfile['enabledModules'] = ['tasks', 'habits', 'goals', 'notes', 'focus', 'discipline'];

const objectIdPattern = /^[a-f\d]{24}$/i;
const isObjectId = (value?: string) => !!value && objectIdPattern.test(value);
const hasApiToken = () => !!getToken();

function normalizeSubtask(subtask: ApiSubtask): Subtask {
  return {
    id: subtask.id ?? subtask._id ?? crypto.randomUUID(),
    title: subtask.title,
    done: subtask.done,
  };
}

export function normalizeTask(task: ApiTask): Task {
  return {
    ...task,
    id: task.id ?? task._id ?? crypto.randomUUID(),
    tags: task.tags ?? [],
    importance: task.importance ?? 3,
    urgency: task.urgency ?? 3,
    effort: task.effort ?? 3,
    energyRequired: task.energyRequired ?? 'medium',
    subtasks: task.subtasks?.map(normalizeSubtask),
  };
}

function serializeTask(task: Partial<Task>): Partial<ApiTask> {
  const payload: Partial<ApiTask> = {
    title: task.title,
    description: task.description || undefined,
    status: task.status,
    priority: task.priority,
    importance: task.importance,
    urgency: task.urgency,
    effort: task.effort,
    energyRequired: task.energyRequired,
    dueDate: task.dueDate || undefined,
    tags: task.tags ?? [],
    goalId: isObjectId(task.goalId) ? task.goalId : undefined,
    lifeArea: task.lifeArea,
    recurrence: task.recurrence,
    lastGeneratedDate: task.lastGeneratedDate,
    recurrenceParentId: isObjectId(task.recurrenceParentId) ? task.recurrenceParentId : undefined,
    subtasks: task.subtasks?.map((subtask) => ({
      ...(isObjectId(subtask.id) ? { _id: subtask.id } : {}),
      title: subtask.title,
      done: subtask.done,
    })),
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key as keyof ApiTask] === undefined) delete payload[key as keyof ApiTask];
  });

  return payload;
}

function normalizeHabit(habit: ApiHabit): Habit {
  return {
    ...habit,
    id: habit.id ?? habit._id ?? crypto.randomUUID(),
    streak: habit.streak ?? 0,
    completedDates: habit.completedDates ?? [],
  };
}

export function normalizeGoal(goal: ApiGoal): Goal {
  return {
    ...goal,
    id: goal.id ?? goal._id ?? crypto.randomUUID(),
    progress: goal.progress ?? 0,
    milestones: (goal.milestones ?? []).map(m => ({
      id: m.id ?? m._id ?? crypto.randomUUID(),
      title: m.title,
      completed: m.completed ?? false,
    })),
    linkedTaskIds: (goal.linkedTaskIds ?? []).map(id => String(id)),
    linkedHabitIds: (goal.linkedHabitIds ?? []).map(id => String(id)),
    linkedNoteIds: (goal.linkedNoteIds ?? []).map(id => String(id)),
    createdAt: goal.createdAt ?? new Date().toISOString(),
  };
}

function serializeGoal(goal: Partial<Goal>): Partial<ApiGoal> {
  const payload: Partial<ApiGoal> = {
    title: goal.title,
    description: goal.description || undefined,
    targetDate: goal.targetDate || undefined,
    progress: goal.progress,
    milestones: goal.milestones?.map(m => ({
      ...(isObjectId(m.id) ? { _id: m.id } : {}),
      title: m.title,
      completed: m.completed,
    })),
    linkedTaskIds: goal.linkedTaskIds?.filter(isObjectId),
    linkedHabitIds: goal.linkedHabitIds?.filter(isObjectId),
    linkedNoteIds: goal.linkedNoteIds?.filter(isObjectId),
    lifeArea: goal.lifeArea,
  };
  Object.keys(payload).forEach((key) => {
    if (payload[key as keyof ApiGoal] === undefined) delete payload[key as keyof ApiGoal];
  });
  return payload;
}

export function normalizeNote(note: ApiNote): Note {
  return {
    ...note,
    id: note.id ?? note._id ?? crypto.randomUUID(),
    tags: note.tags ?? [],
    pinned: note.pinned ?? false,
    createdAt: note.createdAt ?? new Date().toISOString(),
    updatedAt: note.updatedAt ?? note.createdAt ?? new Date().toISOString(),
  };
}

function serializeNote(note: Partial<Note>): Partial<ApiNote> {
  const payload: Partial<ApiNote> = {
    title: note.title,
    content: note.content,
    tags: note.tags,
    pinned: note.pinned,
    folder: note.folder || undefined,
    lifeArea: note.lifeArea,
    goalId: isObjectId(note.goalId) ? note.goalId : undefined,
    taskId: isObjectId(note.taskId) ? note.taskId : undefined,
  };
  Object.keys(payload).forEach((key) => {
    if (payload[key as keyof ApiNote] === undefined) delete payload[key as keyof ApiNote];
  });
  return payload;
}

function normalizeProfileFromApi(user: ApiUser): UserProfile {
  const preferences = {
    ...DEFAULT_PREFERENCES,
    ...user.preferences,
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...(user.preferences?.notifications ?? {}),
    },
    sensory: {
      ...DEFAULT_PREFERENCES.sensory,
      ...(user.preferences?.sensory ?? {}),
    },
  };
  return {
    name: user.name,
    email: user.email,
    lifestyleMode: user.lifestyleMode ?? 'personal-growth',
    enabledModules: [...new Set([...(user.enabledModules ?? DEFAULT_MODULES), 'discipline' as const])],
    theme: user.theme ?? 'light',
    improvementFocus: user.improvementFocus,
    dayIntensity: user.dayIntensity,
    dashboardPriority: user.dashboardPriority,
    preferences,
  };
}

function serializeHabit(habit: Partial<Habit>): Partial<ApiHabit> {
  const payload: Partial<ApiHabit> = {
    title: habit.title,
    description: habit.description || undefined,
    frequency: habit.frequency,
    streak: habit.streak,
    completedDates: habit.completedDates,
    goalId: isObjectId(habit.goalId) ? habit.goalId : undefined,
    lifeArea: habit.lifeArea,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key as keyof ApiHabit] === undefined) delete payload[key as keyof ApiHabit];
  });

  return payload;
}

const normalizeDailyStart = (flow: ApiDailyStart): DailyStart => ({
  ...flow,
  id: flow.id ?? flow._id ?? crypto.randomUUID(),
  topTaskIds: flow.topTaskIds ?? [],
  habitIds: flow.habitIds ?? [],
});

const normalizeEveningShutdown = (flow: ApiEveningShutdown): EveningShutdown => ({
  ...flow,
  id: flow.id ?? flow._id ?? crypto.randomUUID(),
  completedTaskIds: flow.completedTaskIds ?? [],
  delayedTaskIds: flow.delayedTaskIds ?? [],
});

const normalizeDisciplineTarget = (target: ApiDisciplineTarget): DisciplineTarget => ({
  ...target,
  id: target.id ?? target._id ?? crypto.randomUUID(),
  status: target.status ?? 'active',
  createdAt: target.createdAt ?? new Date().toISOString(),
});

const normalizeReplacementAction = (action: ApiReplacementAction): ReplacementAction => ({
  ...action,
  id: action.id ?? action._id ?? crypto.randomUUID(),
  category: action.category ?? 'custom',
  durationMinutes: action.durationMinutes ?? 2,
  isDefault: action.isDefault ?? false,
  createdAt: action.createdAt ?? new Date().toISOString(),
});

const normalizeUrgeLog = (urge: ApiUrgeLog): UrgeLog => ({
  ...urge,
  id: urge.id ?? urge._id ?? crypto.randomUUID(),
  replacementCompleted: urge.replacementCompleted ?? false,
  occurredAt: urge.occurredAt ?? new Date().toISOString(),
  createdAt: urge.createdAt ?? urge.occurredAt ?? new Date().toISOString(),
});

const getFlowMap = <T,>(key: string): Record<string, T> => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, T>;
  } catch {
    return {};
  }
};

const setFlow = <T extends { date: string }>(key: string, value: T) => {
  const next = { ...getFlowMap<T>(key), [value.date]: value };
  localStorage.setItem(key, JSON.stringify(next));
  return value;
};

const emptySearchResults = (): SearchResults => ({ task: [], habit: [], goal: [], note: [], review: [] });

function buildLocalDisciplineInsights(periodDays = 30): DisciplineInsights {
  const since = new Date();
  since.setDate(since.getDate() - periodDays + 1);
  since.setHours(0, 0, 0, 0);
  const urges = store.getUrgeLogs().filter(urge => new Date(urge.occurredAt).getTime() >= since.getTime());
  const tally = (field: 'trigger' | 'emotion' | 'context') => {
    const counts = new Map<string, number>();
    urges.forEach(urge => {
      const label = urge[field]?.trim();
      if (!label) return;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));
  };
  const hours = new Map<number, number>();
  urges.forEach(urge => {
    const hour = new Date(urge.occurredAt).getHours();
    hours.set(hour, (hours.get(hour) ?? 0) + 1);
  });
  const totalIntensity = urges.reduce((sum, urge) => sum + urge.intensity, 0);
  return {
    periodDays,
    totalUrges: urges.length,
    interruptedCount: urges.filter(urge => urge.outcome === 'interrupted').length,
    delayedCount: urges.filter(urge => urge.outcome === 'delayed').length,
    relapseCount: urges.filter(urge => urge.outcome === 'relapsed').length,
    replacementCompletedCount: urges.filter(urge => urge.replacementCompleted).length,
    averageIntensity: urges.length ? Math.round((totalIntensity / urges.length) * 10) / 10 : 0,
    topTriggers: tally('trigger'),
    topEmotions: tally('emotion'),
    topContexts: tally('context'),
    highRiskHours: [...hours.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([hour, count]) => ({ hour, count })),
    recentUrges: urges.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 5),
  };
}

export const dataLayer = {
  // Tasks
  listTasks: async (): Promise<Task[]> => {
    if (!hasApiToken()) return delay(store.getTasks());
    const tasks = await api.get<ApiTask[]>('/api/tasks?limit=100');
    return tasks.map(normalizeTask);
  },
  createTask: async (task: TaskPayload): Promise<Task> => {
    if (!hasApiToken()) {
      const newTask: Task = { ...task, id: `t${Date.now()}`, createdAt: new Date().toISOString() };
      store.setTasks([newTask, ...store.getTasks()]);
      return delay(newTask);
    }
    return normalizeTask(await api.post<ApiTask>('/api/tasks', serializeTask(task)));
  },
  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    if (!hasApiToken()) {
      const updated = store.getTasks().map(t => t.id === id ? { ...t, ...updates } : t);
      store.setTasks(updated);
      return delay(updated.find(t => t.id === id)!);
    }
    return normalizeTask(await api.put<ApiTask>(`/api/tasks/${id}`, serializeTask(updates)));
  },
  updateTaskStatus: async (id: string, status: Task['status']): Promise<Task> => {
    if (!hasApiToken()) return dataLayer.updateTask(id, { status });
    return normalizeTask(await api.patch<ApiTask>(`/api/tasks/${id}/status`, { status }));
  },
  updateSubtask: async (taskId: string, subtaskId: string, done: boolean): Promise<Task> => {
    if (!hasApiToken() || !isObjectId(subtaskId)) {
      const task = store.getTasks().find(t => t.id === taskId);
      return dataLayer.updateTask(taskId, {
        subtasks: task?.subtasks?.map(s => s.id === subtaskId ? { ...s, done } : s),
      });
    }
    return normalizeTask(await api.patch<ApiTask>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, { done }));
  },
  deleteTask: async (id: string): Promise<string> => {
    if (!hasApiToken()) {
      store.setTasks(store.getTasks().filter(t => t.id !== id));
      return delay(id);
    }
    await api.delete<unknown>(`/api/tasks/${id}`);
    return id;
  },
  saveTasks: (t: Task[]): Promise<Task[]> => { store.setTasks(t); return delay(t); },

  // Habits
  listHabits: async (): Promise<Habit[]> => {
    if (!hasApiToken()) return delay(store.getHabits());
    const habits = await api.get<ApiHabit[]>('/api/habits');
    return habits.map(normalizeHabit);
  },
  createHabit: async (habit: HabitPayload): Promise<Habit> => {
    if (!hasApiToken()) {
      const newHabit: Habit = {
        ...habit,
        id: `h${Date.now()}`,
        streak: habit.streak ?? 0,
        completedDates: habit.completedDates ?? [],
        createdAt: new Date().toISOString(),
      };
      store.setHabits([newHabit, ...store.getHabits()]);
      return delay(newHabit);
    }
    return normalizeHabit(await api.post<ApiHabit>('/api/habits', serializeHabit(habit)));
  },
  updateHabit: async (id: string, updates: Partial<Habit>): Promise<Habit> => {
    if (!hasApiToken()) {
      const updated = store.getHabits().map(h => h.id === id ? { ...h, ...updates } : h);
      store.setHabits(updated);
      return delay(updated.find(h => h.id === id)!);
    }
    return normalizeHabit(await api.put<ApiHabit>(`/api/habits/${id}`, serializeHabit(updates)));
  },
  toggleHabit: async (id: string, date: string): Promise<Habit> => {
    if (!hasApiToken()) {
      const habit = store.getHabits().find(h => h.id === id);
      if (!habit) throw new Error('Habit not found');
      const done = habit.completedDates.includes(date);
      return dataLayer.updateHabit(id, {
        completedDates: done ? habit.completedDates.filter(d => d !== date) : [...habit.completedDates, date],
        streak: done ? Math.max(0, habit.streak - 1) : habit.streak + 1,
      });
    }
    return normalizeHabit(await api.patch<ApiHabit>(`/api/habits/${id}/toggle`, { date }));
  },
  deleteHabit: async (id: string): Promise<string> => {
    if (!hasApiToken()) {
      store.setHabits(store.getHabits().filter(h => h.id !== id));
      return delay(id);
    }
    await api.delete<unknown>(`/api/habits/${id}`);
    return id;
  },
  saveHabits: (h: Habit[]): Promise<Habit[]> => { store.setHabits(h); return delay(h); },

  // Goals
  listGoals: async (): Promise<Goal[]> => {
    if (!hasApiToken()) return delay(store.getGoals());
    const goals = await api.get<ApiGoal[]>('/api/goals');
    return goals.map(normalizeGoal);
  },
  createGoal: async (goal: Omit<Goal, 'id' | 'createdAt' | 'progress' | 'milestones' | 'linkedTaskIds' | 'linkedHabitIds' | 'linkedNoteIds'> & Partial<Pick<Goal, 'milestones' | 'linkedTaskIds' | 'linkedHabitIds' | 'linkedNoteIds'>>): Promise<Goal> => {
    if (!hasApiToken()) {
      const newGoal: Goal = {
        ...goal,
        id: `g${Date.now()}`,
        progress: 0,
        milestones: goal.milestones ?? [],
        linkedTaskIds: goal.linkedTaskIds ?? [],
        linkedHabitIds: goal.linkedHabitIds ?? [],
        linkedNoteIds: goal.linkedNoteIds ?? [],
        createdAt: new Date().toISOString(),
      };
      store.setGoals([newGoal, ...store.getGoals()]);
      return delay(newGoal);
    }
    return normalizeGoal(await api.post<ApiGoal>('/api/goals', serializeGoal(goal)));
  },
  updateGoal: async (id: string, updates: Partial<Goal>): Promise<Goal> => {
    if (!hasApiToken()) {
      const updated = store.getGoals().map(g => g.id === id ? { ...g, ...updates } : g);
      store.setGoals(updated);
      return delay(updated.find(g => g.id === id)!);
    }
    return normalizeGoal(await api.put<ApiGoal>(`/api/goals/${id}`, serializeGoal(updates)));
  },
  toggleGoalMilestone: async (goalId: string, milestoneId: string): Promise<Goal> => {
    if (!hasApiToken() || !isObjectId(milestoneId)) {
      const goal = store.getGoals().find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');
      const milestones = goal.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
      const progress = milestones.length ? Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100) : goal.progress;
      return dataLayer.updateGoal(goalId, { milestones, progress });
    }
    return normalizeGoal(await api.patch<ApiGoal>(`/api/goals/${goalId}/milestones/${milestoneId}/toggle`, {}));
  },
  addGoalMilestone: async (goalId: string, title: string): Promise<Goal> => {
    if (!hasApiToken()) {
      const goal = store.getGoals().find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');
      const milestones = [...goal.milestones, { id: `m${Date.now()}`, title, completed: false }];
      return dataLayer.updateGoal(goalId, { milestones });
    }
    return normalizeGoal(await api.post<ApiGoal>(`/api/goals/${goalId}/milestones`, { title }));
  },
  deleteGoal: async (id: string): Promise<string> => {
    if (!hasApiToken()) {
      store.setGoals(store.getGoals().filter(g => g.id !== id));
      return delay(id);
    }
    await api.delete<unknown>(`/api/goals/${id}`);
    return id;
  },
  saveGoals: (g: Goal[]): Promise<Goal[]> => { store.setGoals(g); return delay(g); },

  // Notes
  listNotes: async (search?: string): Promise<Note[]> => {
    if (!hasApiToken()) {
      const notes = store.getNotes();
      if (!search?.trim()) return delay(notes);
      const s = search.toLowerCase();
      return delay(notes.filter(n =>
        n.title.toLowerCase().includes(s) ||
        n.content.toLowerCase().includes(s) ||
        n.tags.some(t => t.toLowerCase().includes(s)),
      ));
    }
    const q = search?.trim() ? `?search=${encodeURIComponent(search)}` : '';
    const notes = await api.get<ApiNote[]>(`/api/notes${q}`);
    return notes.map(normalizeNote);
  },
  createNote: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    if (!hasApiToken()) {
      const now = new Date().toISOString();
      const newNote: Note = { ...note, id: `n${Date.now()}`, createdAt: now, updatedAt: now };
      store.setNotes([newNote, ...store.getNotes()]);
      return delay(newNote);
    }
    return normalizeNote(await api.post<ApiNote>('/api/notes', serializeNote(note)));
  },
  updateNote: async (id: string, updates: Partial<Note>): Promise<Note> => {
    if (!hasApiToken()) {
      const updated = store.getNotes().map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n);
      store.setNotes(updated);
      return delay(updated.find(n => n.id === id)!);
    }
    return normalizeNote(await api.put<ApiNote>(`/api/notes/${id}`, serializeNote(updates)));
  },
  toggleNotePin: async (id: string): Promise<Note> => {
    if (!hasApiToken()) {
      const note = store.getNotes().find(n => n.id === id);
      if (!note) throw new Error('Note not found');
      return dataLayer.updateNote(id, { pinned: !note.pinned });
    }
    return normalizeNote(await api.patch<ApiNote>(`/api/notes/${id}/pin`, {}));
  },
  deleteNote: async (id: string): Promise<string> => {
    if (!hasApiToken()) {
      store.setNotes(store.getNotes().filter(n => n.id !== id));
      return delay(id);
    }
    await api.delete<unknown>(`/api/notes/${id}`);
    return id;
  },
  saveNotes: (n: Note[]): Promise<Note[]> => { store.setNotes(n); return delay(n); },

  // Focus sessions
  listFocusSessions: async (): Promise<FocusSession[]> => {
    if (!hasApiToken()) return delay(store.getFocusSessions());
    type ApiFocus = Omit<FocusSession, 'id'> & { _id?: string; id?: string };
    const rows = await api.get<ApiFocus[]>('/api/focus');
    return rows.map(s => ({ ...s, id: s.id ?? s._id ?? crypto.randomUUID() }));
  },
  createFocusSession: async (session: Omit<FocusSession, 'id'>): Promise<{ session: FocusSession; progress?: UserProgress }> => {
    if (!hasApiToken()) {
      const created: FocusSession = { ...session, id: `f${Date.now()}` };
      store.setFocusSessions([created, ...store.getFocusSessions()]);
      const progress = recordLocalProgressEvent({
        type: 'focus_completed',
        entityId: created.id,
        date: session.completedAt,
        metadata: { duration: session.duration, taskId: session.taskId, key: `focus_completed:${created.id}` },
      });
      return delay({ session: created, progress });
    }
    type ApiFocus = Omit<FocusSession, 'id'> & { _id?: string };
    const res = await api.post<{ session?: ApiFocus; progress?: UserProgress } & ApiFocus>('/api/focus', {
      label: session.label,
      duration: session.duration,
      completedAt: session.completedAt,
      sessionGoal: session.sessionGoal,
      interruptions: session.interruptions,
      taskId: isObjectId(session.taskId) ? session.taskId : undefined,
    });
    const raw = 'session' in res && res.session ? res.session : res as ApiFocus;
    const created = { ...session, id: raw.id ?? raw._id ?? crypto.randomUUID() };
    return { session: created, progress: 'progress' in res ? res.progress : undefined };
  },
  saveFocusSessions: (s: FocusSession[]): Promise<FocusSession[]> => {
    if (!hasApiToken()) { store.setFocusSessions(s); return delay(s); }
    return delay(s);
  },

  // Discipline Engine
  listDisciplineTargets: async (): Promise<DisciplineTarget[]> => {
    if (!hasApiToken()) return delay(store.getDisciplineTargets());
    const targets = await api.get<ApiDisciplineTarget[]>('/api/discipline/targets');
    return targets.map(normalizeDisciplineTarget);
  },
  createDisciplineTarget: async (target: DisciplineTargetPayload): Promise<DisciplineTarget> => {
    if (!hasApiToken()) {
      const now = new Date().toISOString();
      const created: DisciplineTarget = { ...target, id: `dt${Date.now()}`, createdAt: now, updatedAt: now };
      store.setDisciplineTargets([created, ...store.getDisciplineTargets()]);
      return delay(created);
    }
    return normalizeDisciplineTarget(await api.post<ApiDisciplineTarget>('/api/discipline/targets', target));
  },
  updateDisciplineTarget: async (id: string, updates: Partial<DisciplineTarget>): Promise<DisciplineTarget> => {
    if (!hasApiToken()) {
      const updated = store.getDisciplineTargets().map(target => target.id === id ? { ...target, ...updates, updatedAt: new Date().toISOString() } : target);
      store.setDisciplineTargets(updated);
      return delay(updated.find(target => target.id === id)!);
    }
    return normalizeDisciplineTarget(await api.patch<ApiDisciplineTarget>(`/api/discipline/targets/${id}`, updates));
  },
  deleteDisciplineTarget: async (id: string): Promise<string> => {
    if (!hasApiToken()) {
      store.setDisciplineTargets(store.getDisciplineTargets().filter(target => target.id !== id));
      store.setReplacementActions(store.getReplacementActions().map(action => action.targetId === id ? { ...action, targetId: undefined } : action));
      store.setUrgeLogs(store.getUrgeLogs().map(urge => urge.targetId === id ? { ...urge, targetId: undefined } : urge));
      return delay(id);
    }
    await api.delete<unknown>(`/api/discipline/targets/${id}`);
    return id;
  },
  listReplacementActions: async (): Promise<ReplacementAction[]> => {
    if (!hasApiToken()) return delay(store.getReplacementActions());
    const actions = await api.get<ApiReplacementAction[]>('/api/discipline/replacements');
    return actions.map(normalizeReplacementAction);
  },
  createReplacementAction: async (action: ReplacementActionPayload): Promise<ReplacementAction> => {
    if (!hasApiToken()) {
      const now = new Date().toISOString();
      const created: ReplacementAction = { ...action, id: `ra${Date.now()}`, createdAt: now, updatedAt: now };
      store.setReplacementActions([created, ...store.getReplacementActions()]);
      return delay(created);
    }
    return normalizeReplacementAction(await api.post<ApiReplacementAction>('/api/discipline/replacements', {
      ...action,
      targetId: isObjectId(action.targetId) ? action.targetId : undefined,
    }));
  },
  updateReplacementAction: async (id: string, updates: Partial<ReplacementAction>): Promise<ReplacementAction> => {
    if (!hasApiToken()) {
      const updated = store.getReplacementActions().map(action => action.id === id ? { ...action, ...updates, updatedAt: new Date().toISOString() } : action);
      store.setReplacementActions(updated);
      return delay(updated.find(action => action.id === id)!);
    }
    return normalizeReplacementAction(await api.patch<ApiReplacementAction>(`/api/discipline/replacements/${id}`, {
      ...updates,
      targetId: isObjectId(updates.targetId) ? updates.targetId : undefined,
    }));
  },
  deleteReplacementAction: async (id: string): Promise<string> => {
    if (!hasApiToken()) {
      store.setReplacementActions(store.getReplacementActions().filter(action => action.id !== id));
      store.setUrgeLogs(store.getUrgeLogs().map(urge => urge.replacementActionId === id ? { ...urge, replacementActionId: undefined } : urge));
      return delay(id);
    }
    await api.delete<unknown>(`/api/discipline/replacements/${id}`);
    return id;
  },
  listUrgeLogs: async (): Promise<UrgeLog[]> => {
    if (!hasApiToken()) return delay(store.getUrgeLogs().sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()));
    const urges = await api.get<ApiUrgeLog[]>('/api/discipline/urges');
    return urges.map(normalizeUrgeLog);
  },
  createUrgeLog: async (urge: UrgeLogPayload): Promise<{ urge: UrgeLog; progress?: UserProgress; replacementProgress?: UserProgress }> => {
    if (!hasApiToken()) {
      const now = new Date().toISOString();
      const created: UrgeLog = { ...urge, id: `ul${Date.now()}`, occurredAt: urge.occurredAt ?? now, createdAt: now, updatedAt: now };
      store.setUrgeLogs([created, ...store.getUrgeLogs()]);
      const date = created.occurredAt.slice(0, 10);
      const progress = created.outcome === 'interrupted'
        ? recordLocalProgressEvent({
          type: 'urge_interrupted',
          date,
          entityId: created.id,
          title: 'Urge interrupted',
          description: created.trigger,
          metadata: { key: `urge_interrupted:${created.id}`, trigger: created.trigger },
        })
        : undefined;
      const replacementProgress = created.replacementCompleted
        ? recordLocalProgressEvent({
          type: 'replacement_completed',
          date,
          entityId: created.id,
          title: 'Replacement action completed',
          metadata: { key: `replacement_completed:${created.id}`, replacementActionId: created.replacementActionId },
        })
        : undefined;
      return delay({ urge: created, progress: replacementProgress ?? progress, replacementProgress });
    }
    const res = await api.post<{ urge: ApiUrgeLog; progress?: UserProgress; replacementProgress?: UserProgress }>('/api/discipline/urges', {
      ...urge,
      targetId: isObjectId(urge.targetId) ? urge.targetId : undefined,
      replacementActionId: isObjectId(urge.replacementActionId) ? urge.replacementActionId : undefined,
    });
    return { urge: normalizeUrgeLog(res.urge), progress: res.progress, replacementProgress: res.replacementProgress };
  },
  updateUrgeLog: async (id: string, updates: Partial<UrgeLog>): Promise<{ urge: UrgeLog; progress?: UserProgress }> => {
    if (!hasApiToken()) {
      const previous = store.getUrgeLogs().find(urge => urge.id === id);
      if (!previous) throw new Error('Urge log not found');
      const reviewedAt = updates.review ? new Date().toISOString() : previous.review?.reviewedAt;
      const next: UrgeLog = {
        ...previous,
        ...updates,
        review: updates.review ? { ...updates.review, reviewedAt } : previous.review,
        updatedAt: new Date().toISOString(),
      };
      store.setUrgeLogs(store.getUrgeLogs().map(urge => urge.id === id ? next : urge));
      const date = next.occurredAt.slice(0, 10);
      const progress = !previous.replacementCompleted && next.replacementCompleted
        ? recordLocalProgressEvent({
          type: 'replacement_completed',
          date,
          entityId: next.id,
          title: 'Replacement action completed',
          metadata: { key: `replacement_completed:${next.id}`, replacementActionId: next.replacementActionId },
        })
        : updates.review && !previous.review?.reviewedAt
          ? recordLocalProgressEvent({
            type: 'relapse_reviewed',
            date,
            entityId: next.id,
            title: 'Relapse review completed',
            description: next.trigger,
            metadata: { key: `relapse_reviewed:${next.id}`, trigger: next.trigger },
          })
          : undefined;
      return delay({ urge: next, progress });
    }
    const res = await api.patch<{ urge: ApiUrgeLog; progress?: UserProgress }>(`/api/discipline/urges/${id}`, {
      ...updates,
      targetId: isObjectId(updates.targetId) ? updates.targetId : undefined,
      replacementActionId: isObjectId(updates.replacementActionId) ? updates.replacementActionId : undefined,
      review: updates.review ? {
        ...updates.review,
        nextReplacementActionId: isObjectId(updates.review.nextReplacementActionId) ? updates.review.nextReplacementActionId : undefined,
      } : undefined,
    });
    return { urge: normalizeUrgeLog(res.urge), progress: res.progress };
  },
  getDisciplineInsights: async (periodDays = 30): Promise<DisciplineInsights> => {
    if (!hasApiToken()) return delay(buildLocalDisciplineInsights(periodDays));
    const insights = await api.get<Omit<DisciplineInsights, 'recentUrges'> & { recentUrges: ApiUrgeLog[] }>(`/api/discipline/insights?periodDays=${periodDays}`);
    return { ...insights, recentUrges: insights.recentUrges.map(normalizeUrgeLog) };
  },

  listWeeklyReviews: async (): Promise<WeeklyReview[]> => {
    if (!hasApiToken()) return delay(store.getWeeklyReviews());
    type ApiReview = Omit<WeeklyReview, 'id'> & { _id?: string; id?: string };
    const rows = await api.get<ApiReview[]>('/api/reviews');
    return rows.map(r => ({ ...r, id: r.id ?? r._id ?? crypto.randomUUID() }));
  },
  saveWeeklyReview: async (review: Omit<WeeklyReview, 'id' | 'createdAt'> & { id?: string; reward?: boolean }): Promise<{ review: WeeklyReview; progress?: UserProgress }> => {
    if (!hasApiToken()) {
      const saved: WeeklyReview = {
        ...review,
        id: review.id ?? crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const reviews = store.getWeeklyReviews().filter(r => r.weekStart !== review.weekStart);
      store.setWeeklyReviews([saved, ...reviews]);
      const progress = review.reward === false
        ? undefined
        : recordLocalProgressEvent({
          type: 'weekly_review',
          date: review.weekStart,
          entityId: review.weekStart,
          metadata: { key: `weekly_review:${review.weekStart}` },
        });
      return delay({ review: saved, progress });
    }
    const res = await api.post<{ review?: WeeklyReview & { _id?: string }; progress?: UserProgress } & WeeklyReview>('/api/reviews', {
      weekStart: review.weekStart,
      wentWell: review.wentWell,
      gotIgnored: review.gotIgnored,
      improveNext: review.improveNext,
      carryForward: review.carryForward,
      reward: review.reward,
    });
    const raw = 'review' in res && res.review ? res.review : res;
    const saved: WeeklyReview = {
      id: raw.id ?? (raw as { _id?: string })._id ?? crypto.randomUUID(),
      weekStart: review.weekStart,
      wentWell: raw.wentWell ?? review.wentWell,
      gotIgnored: raw.gotIgnored ?? review.gotIgnored,
      improveNext: raw.improveNext ?? review.improveNext,
      carryForward: raw.carryForward,
      createdAt: raw.createdAt ?? new Date().toISOString(),
    };
    return { review: saved, progress: 'progress' in res ? res.progress : undefined };
  },

  // Profile
  getProfile: async (): Promise<UserProfile | null> => {
    if (!hasApiToken()) return delay(store.getProfile());
    try {
      const user = await api.get<ApiUser>('/api/profile');
      const profile = normalizeProfileFromApi(user);
      store.setProfile(profile);
      return profile;
    } catch {
      return store.getProfile();
    }
  },
  saveProfile: async (p: UserProfile): Promise<UserProfile> => {
    store.setProfile(p);
    if (!hasApiToken()) return delay(p);
    const user = await api.put<ApiUser>('/api/profile', {
      name: p.name,
      theme: p.theme,
      lifestyleMode: p.lifestyleMode,
      enabledModules: p.enabledModules,
      improvementFocus: p.improvementFocus,
      dayIntensity: p.dayIntensity,
      dashboardPriority: p.dashboardPriority,
      preferences: p.preferences,
    });
    const profile = normalizeProfileFromApi(user);
    store.setProfile(profile);
    return profile;
  },

  getDailyStart: async (date: string): Promise<DailyStart | null> => {
    if (!hasApiToken()) return delay(getFlowMap<DailyStart>(flowKeys.dailyStart)[date] ?? null);
    const flow = await api.get<ApiDailyStart | null>(`/api/day-flows/start?date=${encodeURIComponent(date)}`);
    return flow ? normalizeDailyStart(flow) : null;
  },
  saveDailyStart: async (flow: Omit<DailyStart, 'id'>): Promise<{ flow: DailyStart; progress?: UserProgress }> => {
    if (!hasApiToken()) {
      const saved = setFlow(flowKeys.dailyStart, { ...flow, id: `ds${Date.now()}`, confirmedAt: new Date().toISOString() });
      const progress = recordLocalProgressEvent({
        type: 'daily_start',
        date: flow.date,
        entityId: flow.date,
        metadata: { key: `daily_start:${flow.date}` },
      });
      return delay({ flow: saved, progress });
    }
    const res = await api.post<{ flow: ApiDailyStart; progress: UserProgress }>('/api/day-flows/start', {
      ...flow,
      topTaskIds: flow.topTaskIds.filter(isObjectId),
      habitIds: flow.habitIds.filter(isObjectId),
    });
    return { flow: normalizeDailyStart(res.flow), progress: res.progress };
  },
  getEveningShutdown: async (date: string): Promise<EveningShutdown | null> => {
    if (!hasApiToken()) return delay(getFlowMap<EveningShutdown>(flowKeys.eveningShutdown)[date] ?? null);
    const flow = await api.get<ApiEveningShutdown | null>(`/api/day-flows/shutdown?date=${encodeURIComponent(date)}`);
    return flow ? normalizeEveningShutdown(flow) : null;
  },
  saveEveningShutdown: async (flow: Omit<EveningShutdown, 'id'>): Promise<{ flow: EveningShutdown; progress?: UserProgress }> => {
    if (!hasApiToken()) {
      const saved = setFlow(flowKeys.eveningShutdown, { ...flow, id: `es${Date.now()}` });
      const progress = recordLocalProgressEvent({
        type: 'evening_shutdown',
        date: flow.date,
        entityId: flow.date,
        metadata: { key: `evening_shutdown:${flow.date}` },
      });
      return delay({ flow: saved, progress });
    }
    const res = await api.post<{ flow: ApiEveningShutdown; progress: UserProgress }>('/api/day-flows/shutdown', {
      ...flow,
      completedTaskIds: flow.completedTaskIds.filter(isObjectId),
      delayedTaskIds: flow.delayedTaskIds.filter(isObjectId),
    });
    return { flow: normalizeEveningShutdown(res.flow), progress: res.progress };
  },
  search: async (query: string): Promise<SearchResults> => {
    if (!query.trim()) return emptySearchResults();
    if (hasApiToken()) return api.get<SearchResults>(`/api/search?q=${encodeURIComponent(query)}`);
    const { searchAll } = await import('./search');
    return searchAll(query);
  },
  getMomentum: async (periodDays = 30): Promise<LifeMomentum> => {
    if (hasApiToken()) return api.get<LifeMomentum>(`/api/momentum?periodDays=${periodDays}`);
    const today = new Date().toISOString().split('T')[0];
    return delay(computeLifeMomentum({
      tasks: store.getTasks(),
      habits: store.getHabits(),
      goals: store.getGoals(),
      notes: store.getNotes(),
      sessions: store.getFocusSessions(),
      checkIns: store.getCheckIns(),
      reviews: store.getWeeklyReviews(),
      dailyStart: getFlowMap<DailyStart>(flowKeys.dailyStart)[today] ?? null,
      eveningShutdown: getFlowMap<EveningShutdown>(flowKeys.eveningShutdown)[today] ?? null,
      periodDays,
    }));
  },
  getWeeklyNarrative: async (weekStart: string): Promise<WeeklyNarrativeRecap> => {
    if (hasApiToken()) return api.get<WeeklyNarrativeRecap>(`/api/narrative/weekly?weekStart=${encodeURIComponent(weekStart)}`);
    return delay(buildWeeklyNarrative({
      tasks: store.getTasks(),
      habits: store.getHabits(),
      goals: store.getGoals(),
      notes: store.getNotes(),
      sessions: store.getFocusSessions(),
      dailyStarts: Object.values(getFlowMap<DailyStart>(flowKeys.dailyStart)),
      eveningShutdowns: Object.values(getFlowMap<EveningShutdown>(flowKeys.eveningShutdown)),
      reviews: store.getWeeklyReviews(),
      weekStart,
      progressEvents: getLocalProgress().recentEvents,
    }));
  },
  getProgress: async (): Promise<UserProgress> => {
    if (hasApiToken()) return api.get<UserProgress>('/api/progress/today');
    return delay(getLocalProgress());
  },
  recordProgressEvent: async (event: RewardEventInput): Promise<UserProgress> => {
    if (hasApiToken()) return api.post<UserProgress>('/api/progress/event', event);
    return delay(recordLocalProgressEvent(event));
  },
};

export type DataLayer = typeof dataLayer;

/** @internal exported for unit tests */
export const dataLayerTestUtils = {
  normalizeTask,
  normalizeGoal,
  normalizeNote,
  normalizeHabit,
  normalizeProfileFromApi,
};
