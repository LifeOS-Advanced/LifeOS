export type LifestyleMode = 'student' | 'freelancer' | 'employee' | 'creator' | 'personal-growth';

export type ModuleKey = 'tasks' | 'habits' | 'goals' | 'notes' | 'focus';

export type ImprovementArea = 'discipline' | 'studying' | 'productivity' | 'health' | 'money' | 'focus';
export type DayIntensity = 'light' | 'moderate' | 'intense';

export type LifeArea = 'work' | 'study' | 'health' | 'money' | 'personal' | 'family' | 'faith' | 'projects';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  // For weekly: array of weekday indices 0-6 (Sun..Sat). Empty = same weekday as start.
  daysOfWeek?: number[];
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  tags: string[];
  goalId?: string;
  lifeArea?: LifeArea;
  subtasks?: Subtask[];
  recurrence?: RecurrenceRule;
  // For recurring tasks: tracks last generated occurrence date
  lastGeneratedDate?: string;
  // For instances spawned from a recurring template
  recurrenceParentId?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  completedDates: string[];
  goalId?: string;
  lifeArea?: LifeArea;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number;
  milestones: Milestone[];
  linkedTaskIds: string[];
  linkedHabitIds: string[];
  linkedNoteIds: string[];
  lifeArea?: LifeArea;
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string; // HTML (TipTap) or plain text legacy
  tags: string[];
  pinned: boolean;
  taskId?: string;
  goalId?: string;
  lifeArea?: LifeArea;
  folder?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  label: string;
  sessionGoal?: string;
  duration: number; // minutes
  completedAt: string;
  distractionNotes?: string;
  interruptions?: number;
  taskId?: string;
}

export type Mood = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = 'low' | 'medium' | 'high';

export interface DailyCheckIn {
  date: string; // YYYY-MM-DD
  mood: Mood;
  energy: EnergyLevel;
  mainFocus: string;
  oneWord: string;
  createdAt: string;
}

export interface WeeklyReview {
  id: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  wentWell: string;
  gotIgnored: string;
  improveNext: string;
  createdAt: string;
}

export type DashboardWidgetKey = 'today' | 'habits' | 'goals' | 'focus' | 'consistency' | 'insights';

export interface UserPreferences {
  timezone: string;
  weekStartDay: 0 | 1; // 0=Sun, 1=Mon
  defaultFocusDuration: number; // minutes
  dashboardWidgets: DashboardWidgetKey[];
  notifications: {
    dailyReminders: boolean;
    habitStreakAlerts: boolean;
    goalDeadlineWarnings: boolean;
  };
}

export interface UserProfile {
  name: string;
  email: string;
  lifestyleMode: LifestyleMode;
  enabledModules: ModuleKey[];
  theme: 'light' | 'dark' | 'system';
  improvementFocus?: ImprovementArea[];
  dayIntensity?: DayIntensity;
  dashboardPriority?: ModuleKey;
  preferences?: UserPreferences;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
  weekStartDay: 1,
  defaultFocusDuration: 25,
  dashboardWidgets: ['today', 'habits', 'goals', 'focus', 'consistency', 'insights'],
  notifications: {
    dailyReminders: true,
    habitStreakAlerts: true,
    goalDeadlineWarnings: true,
  },
};

