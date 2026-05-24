/**
 * React Query hooks built on the data-layer abstraction.
 * Migrating to a real API only requires updating data-layer.ts.
 */
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { dataLayer } from './data-layer';
import type { Task, Habit, Goal, Note, FocusSession } from './types';

export const queryKeys = {
  tasks: ['tasks'] as QueryKey,
  habits: ['habits'] as QueryKey,
  goals: ['goals'] as QueryKey,
  notes: ['notes'] as QueryKey,
  focus: ['focus-sessions'] as QueryKey,
  profile: ['profile'] as QueryKey,
};

// ---- Tasks ----
export const useTasks = () =>
  useQuery({ queryKey: queryKeys.tasks, queryFn: dataLayer.listTasks, initialData: [] as Task[] });

export const useSaveTasks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (next: Task[]) => dataLayer.saveTasks(next),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: queryKeys.tasks });
      const prev = qc.getQueryData<Task[]>(queryKeys.tasks);
      qc.setQueryData(queryKeys.tasks, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.tasks, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.tasks }),
  });
};

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: Omit<Task, 'id' | 'createdAt'>) => dataLayer.createTask(task),
    onSuccess: (created) => {
      qc.setQueryData<Task[]>(queryKeys.tasks, (prev = []) => [created, ...prev]);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.tasks }),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => dataLayer.updateTask(id, updates),
    onSuccess: (updated) => {
      qc.setQueryData<Task[]>(queryKeys.tasks, (prev = []) => prev.map(task => task.id === updated.id ? updated : task));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.tasks }),
  });
};

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) => dataLayer.updateTaskStatus(id, status),
    onSuccess: (updated) => {
      qc.setQueryData<Task[]>(queryKeys.tasks, (prev = []) => prev.map(task => task.id === updated.id ? updated : task));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.tasks }),
  });
};

export const useUpdateSubtask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, subtaskId, done }: { taskId: string; subtaskId: string; done: boolean }) =>
      dataLayer.updateSubtask(taskId, subtaskId, done),
    onSuccess: (updated) => {
      qc.setQueryData<Task[]>(queryKeys.tasks, (prev = []) => prev.map(task => task.id === updated.id ? updated : task));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.tasks }),
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataLayer.deleteTask(id),
    onSuccess: (id) => {
      qc.setQueryData<Task[]>(queryKeys.tasks, (prev = []) => prev.filter(task => task.id !== id));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.tasks }),
  });
};

// ---- Habits ----
export const useHabits = () =>
  useQuery({ queryKey: queryKeys.habits, queryFn: dataLayer.listHabits, initialData: [] as Habit[] });

export const useSaveHabits = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (next: Habit[]) => dataLayer.saveHabits(next),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: queryKeys.habits });
      const prev = qc.getQueryData<Habit[]>(queryKeys.habits);
      qc.setQueryData(queryKeys.habits, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(queryKeys.habits, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.habits }),
  });
};

// ---- Goals ----
export const useGoals = () =>
  useQuery({ queryKey: queryKeys.goals, queryFn: dataLayer.listGoals, initialData: [] as Goal[] });

export const useSaveGoals = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (next: Goal[]) => dataLayer.saveGoals(next),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: queryKeys.goals });
      const prev = qc.getQueryData<Goal[]>(queryKeys.goals);
      qc.setQueryData(queryKeys.goals, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(queryKeys.goals, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.goals }),
  });
};

// ---- Notes ----
export const useNotes = () =>
  useQuery({ queryKey: queryKeys.notes, queryFn: dataLayer.listNotes, initialData: [] as Note[] });

export const useSaveNotes = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (next: Note[]) => dataLayer.saveNotes(next),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: queryKeys.notes });
      const prev = qc.getQueryData<Note[]>(queryKeys.notes);
      qc.setQueryData(queryKeys.notes, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(queryKeys.notes, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.notes }),
  });
};

// ---- Focus ----
export const useFocusSessions = () =>
  useQuery({ queryKey: queryKeys.focus, queryFn: dataLayer.listFocusSessions, initialData: [] as FocusSession[] });

export const useSaveFocusSessions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (next: FocusSession[]) => dataLayer.saveFocusSessions(next),
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: queryKeys.focus });
      const prev = qc.getQueryData<FocusSession[]>(queryKeys.focus);
      qc.setQueryData(queryKeys.focus, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(queryKeys.focus, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.focus }),
  });
};
