/**
 * React Query hooks built on the data-layer abstraction.
 * Migrating to a real API only requires updating data-layer.ts.
 */
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { dataLayer } from './data-layer';
import type {
  Task,
  Habit,
  Goal,
  Note,
  FocusSession,
  DailyStart,
  EveningShutdown,
  RewardEventInput,
  UserProfile,
  DisciplineTarget,
  ReplacementAction,
  UrgeLog,
} from './types';

export const queryKeys = {
  tasks: ['tasks'] as QueryKey,
  habits: ['habits'] as QueryKey,
  goals: ['goals'] as QueryKey,
  notes: ['notes'] as QueryKey,
  focus: ['focus-sessions'] as QueryKey,
  profile: ['profile'] as QueryKey,
  dailyStart: (date: string) => ['daily-start', date] as QueryKey,
  eveningShutdown: (date: string) => ['evening-shutdown', date] as QueryKey,
  search: (query: string) => ['search', query] as QueryKey,
  momentum: (periodDays: number) => ['momentum', periodDays] as QueryKey,
  weeklyNarrative: (weekStart: string) => ['weekly-narrative', weekStart] as QueryKey,
  progress: ['progress'] as QueryKey,
  disciplineTargets: ['discipline-targets'] as QueryKey,
  replacementActions: ['replacement-actions'] as QueryKey,
  urgeLogs: ['urge-logs'] as QueryKey,
  disciplineInsights: (periodDays: number) => ['discipline-insights', periodDays] as QueryKey,
};

// ---- Tasks ----
export const useTasks = () =>
  useQuery({ queryKey: queryKeys.tasks, queryFn: dataLayer.listTasks });

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
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks });
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
    },
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => dataLayer.updateTask(id, updates),
    onSuccess: (updated) => {
      qc.setQueryData<Task[]>(queryKeys.tasks, (prev = []) => prev.map(task => task.id === updated.id ? updated : task));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks });
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) => dataLayer.updateTaskStatus(id, status),
    onSuccess: (updated) => {
      qc.setQueryData<Task[]>(queryKeys.tasks, (prev = []) => prev.map(task => task.id === updated.id ? updated : task));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks });
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
    },
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
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks });
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
    },
  });
};

export const useDailyStart = (date: string) =>
  useQuery({ queryKey: queryKeys.dailyStart(date), queryFn: () => dataLayer.getDailyStart(date) });

export const useSaveDailyStart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flow: Omit<DailyStart, 'id'>) => dataLayer.saveDailyStart(flow),
    onSuccess: ({ flow, progress }) => {
      qc.setQueryData(queryKeys.dailyStart(flow.date), flow);
      if (progress) qc.setQueryData(queryKeys.progress, progress);
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
      qc.invalidateQueries({ queryKey: ['weekly-narrative'] });
    },
  });
};

export const useEveningShutdown = (date: string) =>
  useQuery({ queryKey: queryKeys.eveningShutdown(date), queryFn: () => dataLayer.getEveningShutdown(date) });

export const useSaveEveningShutdown = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flow: Omit<EveningShutdown, 'id'>) => dataLayer.saveEveningShutdown(flow),
    onSuccess: ({ flow, progress }) => {
      qc.setQueryData(queryKeys.eveningShutdown(flow.date), flow);
      if (progress) qc.setQueryData(queryKeys.progress, progress);
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
      qc.invalidateQueries({ queryKey: ['weekly-narrative'] });
    },
  });
};

export const useUniversalSearch = (query: string) =>
  useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => dataLayer.search(query),
    enabled: query.trim().length > 0,
  });

export const useLifeMomentum = (periodDays = 30) =>
  useQuery({ queryKey: queryKeys.momentum(periodDays), queryFn: () => dataLayer.getMomentum(periodDays) });

export const useWeeklyNarrative = (weekStart: string) =>
  useQuery({ queryKey: queryKeys.weeklyNarrative(weekStart), queryFn: () => dataLayer.getWeeklyNarrative(weekStart) });

export const useProgress = () =>
  useQuery({ queryKey: queryKeys.progress, queryFn: dataLayer.getProgress });

export const useRecordProgressEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (event: RewardEventInput) => dataLayer.recordProgressEvent(event),
    onSuccess: (progress) => {
      qc.setQueryData(queryKeys.progress, progress);
      qc.invalidateQueries({ queryKey: ['momentum'] });
    },
  });
};

// ---- Habits ----
export const useHabits = () =>
  useQuery({ queryKey: queryKeys.habits, queryFn: dataLayer.listHabits });

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

export const useCreateHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (habit: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'completedDates'>) => dataLayer.createHabit(habit),
    onSuccess: (created) => {
      qc.setQueryData<Habit[]>(queryKeys.habits, (prev = []) => [created, ...prev]);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.habits });
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
    },
  });
};

export const useUpdateHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Habit> }) => dataLayer.updateHabit(id, updates),
    onSuccess: (updated) => {
      qc.setQueryData<Habit[]>(queryKeys.habits, (prev = []) => prev.map(habit => habit.id === updated.id ? updated : habit));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.habits });
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
    },
  });
};

export const useToggleHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => dataLayer.toggleHabit(id, date),
    onSuccess: (updated) => {
      qc.setQueryData<Habit[]>(queryKeys.habits, (prev = []) => prev.map(habit => habit.id === updated.id ? updated : habit));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.habits });
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
    },
  });
};

export const useDeleteHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataLayer.deleteHabit(id),
    onSuccess: (id) => {
      qc.setQueryData<Habit[]>(queryKeys.habits, (prev = []) => prev.filter(habit => habit.id !== id));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.habits });
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
    },
  });
};

// ---- Goals ----
export const useGoals = () =>
  useQuery({ queryKey: queryKeys.goals, queryFn: dataLayer.listGoals });

export const useCreateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dataLayer.createGoal,
    onSuccess: (created) => {
      qc.setQueryData<Goal[]>(queryKeys.goals, (prev = []) => [created, ...prev]);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.goals }),
  });
};

export const useUpdateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Goal> }) => dataLayer.updateGoal(id, updates),
    onSuccess: (updated) => {
      qc.setQueryData<Goal[]>(queryKeys.goals, (prev = []) => prev.map(g => g.id === updated.id ? updated : g));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.goals }),
  });
};

export const useToggleGoalMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) =>
      dataLayer.toggleGoalMilestone(goalId, milestoneId),
    onSuccess: (updated) => {
      qc.setQueryData<Goal[]>(queryKeys.goals, (prev = []) => prev.map(g => g.id === updated.id ? updated : g));
    },
  });
};

export const useAddGoalMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, title }: { goalId: string; title: string }) => dataLayer.addGoalMilestone(goalId, title),
    onSuccess: (updated) => {
      qc.setQueryData<Goal[]>(queryKeys.goals, (prev = []) => prev.map(g => g.id === updated.id ? updated : g));
    },
  });
};

export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataLayer.deleteGoal(id),
    onSuccess: (id) => {
      qc.setQueryData<Goal[]>(queryKeys.goals, (prev = []) => prev.filter(g => g.id !== id));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.goals }),
  });
};

// ---- Notes ----
export const useNotes = (search?: string) =>
  useQuery({
    queryKey: search ? [...queryKeys.notes, search] as QueryKey : queryKeys.notes,
    queryFn: () => dataLayer.listNotes(search),
  });

export const useCreateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => dataLayer.createNote(note),
    onSuccess: (created) => {
      qc.setQueryData<Note[]>(queryKeys.notes, (prev = []) => [created, ...prev]);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.notes }),
  });
};

export const useUpdateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Note> }) => dataLayer.updateNote(id, updates),
    onSuccess: (updated) => {
      qc.setQueryData<Note[]>(queryKeys.notes, (prev = []) => prev.map(n => n.id === updated.id ? updated : n));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.notes }),
  });
};

export const useToggleNotePin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataLayer.toggleNotePin(id),
    onSuccess: (updated) => {
      qc.setQueryData<Note[]>(queryKeys.notes, (prev = []) => prev.map(n => n.id === updated.id ? updated : n));
    },
  });
};

export const useDeleteNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataLayer.deleteNote(id),
    onSuccess: (id) => {
      qc.setQueryData<Note[]>(queryKeys.notes, (prev = []) => prev.filter(n => n.id !== id));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.notes }),
  });
};

// ---- Discipline Engine ----
export const useDisciplineTargets = () =>
  useQuery({ queryKey: queryKeys.disciplineTargets, queryFn: dataLayer.listDisciplineTargets });

export const useCreateDisciplineTarget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dataLayer.createDisciplineTarget,
    onSuccess: (created) => {
      qc.setQueryData<DisciplineTarget[]>(queryKeys.disciplineTargets, (prev = []) => [created, ...prev]);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.disciplineTargets }),
  });
};

export const useUpdateDisciplineTarget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DisciplineTarget> }) => dataLayer.updateDisciplineTarget(id, updates),
    onSuccess: (updated) => {
      qc.setQueryData<DisciplineTarget[]>(queryKeys.disciplineTargets, (prev = []) => prev.map(target => target.id === updated.id ? updated : target));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.disciplineTargets }),
  });
};

export const useDeleteDisciplineTarget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataLayer.deleteDisciplineTarget(id),
    onSuccess: (id) => {
      qc.setQueryData<DisciplineTarget[]>(queryKeys.disciplineTargets, (prev = []) => prev.filter(target => target.id !== id));
      qc.invalidateQueries({ queryKey: queryKeys.replacementActions });
      qc.invalidateQueries({ queryKey: queryKeys.urgeLogs });
      qc.invalidateQueries({ queryKey: ['discipline-insights'] });
    },
  });
};

export const useReplacementActions = () =>
  useQuery({ queryKey: queryKeys.replacementActions, queryFn: dataLayer.listReplacementActions });

export const useCreateReplacementAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dataLayer.createReplacementAction,
    onSuccess: (created) => {
      qc.setQueryData<ReplacementAction[]>(queryKeys.replacementActions, (prev = []) => [created, ...prev]);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.replacementActions }),
  });
};

export const useUpdateReplacementAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ReplacementAction> }) => dataLayer.updateReplacementAction(id, updates),
    onSuccess: (updated) => {
      qc.setQueryData<ReplacementAction[]>(queryKeys.replacementActions, (prev = []) => prev.map(action => action.id === updated.id ? updated : action));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.replacementActions }),
  });
};

export const useDeleteReplacementAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataLayer.deleteReplacementAction(id),
    onSuccess: (id) => {
      qc.setQueryData<ReplacementAction[]>(queryKeys.replacementActions, (prev = []) => prev.filter(action => action.id !== id));
      qc.invalidateQueries({ queryKey: queryKeys.urgeLogs });
      qc.invalidateQueries({ queryKey: ['discipline-insights'] });
    },
  });
};

export const useUrgeLogs = () =>
  useQuery({ queryKey: queryKeys.urgeLogs, queryFn: dataLayer.listUrgeLogs });

export const useCreateUrgeLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dataLayer.createUrgeLog,
    onSuccess: ({ urge, progress }) => {
      qc.setQueryData<UrgeLog[]>(queryKeys.urgeLogs, (prev = []) => [urge, ...prev.filter(row => row.id !== urge.id)]);
      if (progress) qc.setQueryData(queryKeys.progress, progress);
      qc.invalidateQueries({ queryKey: ['discipline-insights'] });
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
      qc.invalidateQueries({ queryKey: ['weekly-narrative'] });
    },
  });
};

export const useUpdateUrgeLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<UrgeLog> }) => dataLayer.updateUrgeLog(id, updates),
    onSuccess: ({ urge, progress }) => {
      qc.setQueryData<UrgeLog[]>(queryKeys.urgeLogs, (prev = []) => prev.map(row => row.id === urge.id ? urge : row));
      if (progress) qc.setQueryData(queryKeys.progress, progress);
      qc.invalidateQueries({ queryKey: ['discipline-insights'] });
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
      qc.invalidateQueries({ queryKey: ['weekly-narrative'] });
    },
  });
};

export const useDisciplineInsights = (periodDays = 30) =>
  useQuery({ queryKey: queryKeys.disciplineInsights(periodDays), queryFn: () => dataLayer.getDisciplineInsights(periodDays) });

// ---- Profile ----
export const useProfile = () =>
  useQuery({ queryKey: queryKeys.profile, queryFn: dataLayer.getProfile });

export const useSaveProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: UserProfile) => dataLayer.saveProfile(profile),
    onSuccess: (profile) => {
      if (profile) qc.setQueryData(queryKeys.profile, profile);
    },
  });
};

// ---- Focus ----
export const useFocusSessions = () =>
  useQuery({ queryKey: queryKeys.focus, queryFn: dataLayer.listFocusSessions });

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

export const useCreateFocusSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (session: Omit<FocusSession, 'id'>) => dataLayer.createFocusSession(session),
    onSuccess: ({ session, progress }) => {
      qc.setQueryData<FocusSession[]>(queryKeys.focus, (prev = []) => [session, ...prev]);
      if (progress) qc.setQueryData(queryKeys.progress, progress);
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
      qc.invalidateQueries({ queryKey: ['weekly-narrative'] });
    },
  });
};

export const useWeeklyReviews = () =>
  useQuery({ queryKey: ['weekly-reviews'], queryFn: dataLayer.listWeeklyReviews });

export const useSaveWeeklyReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (review: Parameters<typeof dataLayer.saveWeeklyReview>[0]) => dataLayer.saveWeeklyReview(review),
    onSuccess: ({ progress }) => {
      if (progress) qc.setQueryData(queryKeys.progress, progress);
      qc.invalidateQueries({ queryKey: ['weekly-reviews'] });
      qc.invalidateQueries({ queryKey: ['momentum'] });
      qc.invalidateQueries({ queryKey: queryKeys.progress });
      qc.invalidateQueries({ queryKey: ['weekly-narrative'] });
    },
  });
};
