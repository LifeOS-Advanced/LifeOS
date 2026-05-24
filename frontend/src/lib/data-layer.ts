/**
 * Data layer abstraction. Currently backed by localStorage via store.ts.
 * Swap implementations here when migrating to a real API — call sites
 * (React Query hooks) won't change.
 */
import * as store from './store';
import { api, getToken } from './api';
import type { Task, Habit, Goal, Note, FocusSession, UserProfile, Subtask } from './types';

const delay = <T,>(v: T) => Promise.resolve(v);

type ApiSubtask = Omit<Subtask, 'id'> & { _id?: string; id?: string };
type ApiTask = Omit<Task, 'id' | 'subtasks'> & {
  _id?: string;
  id?: string;
  subtasks?: ApiSubtask[];
};

type TaskPayload = Omit<Task, 'id' | 'createdAt'> & Partial<Pick<Task, 'createdAt'>>;

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

function normalizeTask(task: ApiTask): Task {
  return {
    ...task,
    id: task.id ?? task._id ?? crypto.randomUUID(),
    tags: task.tags ?? [],
    subtasks: task.subtasks?.map(normalizeSubtask),
  };
}

function serializeTask(task: Partial<Task>): Partial<ApiTask> {
  const payload: Partial<ApiTask> = {
    title: task.title,
    description: task.description || undefined,
    status: task.status,
    priority: task.priority,
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
  listHabits: (): Promise<Habit[]> => delay(store.getHabits()),
  saveHabits: (h: Habit[]): Promise<Habit[]> => { store.setHabits(h); return delay(h); },

  // Goals
  listGoals: (): Promise<Goal[]> => delay(store.getGoals()),
  saveGoals: (g: Goal[]): Promise<Goal[]> => { store.setGoals(g); return delay(g); },

  // Notes
  listNotes: (): Promise<Note[]> => delay(store.getNotes()),
  saveNotes: (n: Note[]): Promise<Note[]> => { store.setNotes(n); return delay(n); },

  // Focus sessions
  listFocusSessions: (): Promise<FocusSession[]> => delay(store.getFocusSessions()),
  saveFocusSessions: (s: FocusSession[]): Promise<FocusSession[]> => { store.setFocusSessions(s); return delay(s); },

  // Profile
  getProfile: (): Promise<UserProfile | null> => delay(store.getProfile()),
  saveProfile: (p: UserProfile): Promise<UserProfile> => { store.setProfile(p); return delay(p); },
};

export type DataLayer = typeof dataLayer;
