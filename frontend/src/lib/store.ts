import { Task, Habit, Goal, Note, FocusSession, UserProfile, DailyCheckIn, WeeklyReview } from './types';

const STORAGE_KEYS = {
  tasks: 'lifeos_tasks',
  habits: 'lifeos_habits',
  goals: 'lifeos_goals',
  notes: 'lifeos_notes',
  focusSessions: 'lifeos_focus_sessions',
  profile: 'lifeos_profile',
  onboarded: 'lifeos_onboarded',
  authenticated: 'lifeos_authenticated',
  checkIns: 'lifeos_check_ins',
  reviews: 'lifeos_weekly_reviews',
};

function get<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Auth
export const isAuthenticated = () => get<boolean>(STORAGE_KEYS.authenticated, false);
export const setAuthenticated = (v: boolean) => set(STORAGE_KEYS.authenticated, v);
export const isOnboarded = () => get<boolean>(STORAGE_KEYS.onboarded, false);
export const setOnboarded = (v: boolean) => set(STORAGE_KEYS.onboarded, v);

// Profile
export const getProfile = () => get<UserProfile | null>(STORAGE_KEYS.profile, null);
export const setProfile = (p: UserProfile) => set(STORAGE_KEYS.profile, p);

// Tasks
export const getTasks = () => get<Task[]>(STORAGE_KEYS.tasks, []).map(t => ({
  importance: 3,
  urgency: 3,
  effort: 3,
  energyRequired: 'medium',
  ...t,
}));
export const setTasks = (t: Task[]) => set(STORAGE_KEYS.tasks, t);

// Habits
export const getHabits = () => get<Habit[]>(STORAGE_KEYS.habits, []);
export const setHabits = (h: Habit[]) => set(STORAGE_KEYS.habits, h);

// Goals
export const getGoals = () => get<Goal[]>(STORAGE_KEYS.goals, []).map(g => ({
  ...g,
  linkedTaskIds: g.linkedTaskIds ?? [],
  linkedHabitIds: g.linkedHabitIds ?? [],
  linkedNoteIds: g.linkedNoteIds ?? [],
}));
export const setGoals = (g: Goal[]) => set(STORAGE_KEYS.goals, g);

// Notes
export const getNotes = () => get<Note[]>(STORAGE_KEYS.notes, []);
export const setNotes = (n: Note[]) => set(STORAGE_KEYS.notes, n);

// Focus
export const getFocusSessions = () => get<FocusSession[]>(STORAGE_KEYS.focusSessions, []);
export const setFocusSessions = (s: FocusSession[]) => set(STORAGE_KEYS.focusSessions, s);

// Daily check-ins
export const getCheckIns = () => get<DailyCheckIn[]>(STORAGE_KEYS.checkIns, []);
export const setCheckIns = (c: DailyCheckIn[]) => set(STORAGE_KEYS.checkIns, c);
export const addCheckIn = (c: DailyCheckIn) => {
  const all = getCheckIns().filter(x => x.date !== c.date);
  setCheckIns([c, ...all]);
};
export const getTodayCheckIn = (): DailyCheckIn | undefined => {
  const today = new Date().toISOString().split('T')[0];
  return getCheckIns().find(c => c.date === today);
};

// Weekly reviews
export const getWeeklyReviews = () => get<WeeklyReview[]>(STORAGE_KEYS.reviews, []);
export const setWeeklyReviews = (r: WeeklyReview[]) => set(STORAGE_KEYS.reviews, r);
export const addWeeklyReview = (r: WeeklyReview) => {
  const all = getWeeklyReviews().filter(x => x.weekStart !== r.weekStart);
  setWeeklyReviews([r, ...all]);
};
