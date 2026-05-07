/**
 * Data layer abstraction. Currently backed by localStorage via store.ts.
 * Swap implementations here when migrating to a real API — call sites
 * (React Query hooks) won't change.
 */
import * as store from './store';
import type { Task, Habit, Goal, Note, FocusSession, UserProfile } from './types';

const delay = <T,>(v: T) => Promise.resolve(v);

export const dataLayer = {
  // Tasks
  listTasks: (): Promise<Task[]> => delay(store.getTasks()),
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
