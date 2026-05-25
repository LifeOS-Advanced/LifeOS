export type LifestyleMode = 'student' | 'freelancer' | 'employee' | 'creator' | 'personal-growth';

export type ModuleKey = 'tasks' | 'habits' | 'goals' | 'notes' | 'focus';

export type ImprovementArea = 'discipline' | 'studying' | 'productivity' | 'health' | 'money' | 'focus';
export type DayIntensity = 'light' | 'moderate' | 'intense';

export type LifeArea = 'work' | 'study' | 'health' | 'money' | 'personal' | 'family' | 'faith' | 'projects';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type EnergyRequired = 'low' | 'medium' | 'high';
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
  importance: number;
  urgency: number;
  effort: number;
  energyRequired: EnergyRequired;
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

export interface DailyStart {
  id: string;
  date: string;
  mood: Mood;
  energy: EnergyLevel;
  mainPriority: string;
  topTaskIds: string[];
  habitIds: string[];
  suggestedFocusDuration: number;
  confirmedAt?: string;
  createdAt?: string;
}

export interface EveningShutdown {
  id: string;
  date: string;
  completedTaskIds: string[];
  delayedTaskIds: string[];
  mood: Mood;
  energy: EnergyLevel;
  wentWell: string;
  improveTomorrow: string;
  tomorrowFirstTask: string;
  createdAt?: string;
}

export type SearchResultType = 'task' | 'habit' | 'goal' | 'note' | 'review';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  snippet?: string;
  route: string;
}

export type SearchResults = Record<SearchResultType, SearchResult[]>;

export interface WeeklyReview {
  id: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  wentWell: string;
  gotIgnored: string;
  improveNext: string;
  createdAt: string;
}

export interface MomentumComponentScores {
  tasks: number;
  habits: number;
  focus: number;
  goals: number;
  checkIns: number;
  reviews: number;
  dailyLoop: number;
}

export interface MomentumArea {
  area: LifeArea;
  label: string;
  activityCount: number;
  lastActivityDate: string | null;
  daysSinceActivity: number | null;
  score: number;
  status: 'empty' | 'active' | 'watch' | 'neglected';
}

export interface MomentumWarning {
  area: LifeArea;
  label: string;
  daysSinceActivity: number | null;
  message: string;
}

export interface MomentumSuggestion {
  title: string;
  description: string;
  route: string;
}

export interface LifeMomentum {
  score: number;
  label: string;
  periodDays: number;
  components: MomentumComponentScores;
  week: {
    tasksCompleted: number;
    habitConsistency: number;
    focusMinutes: number;
    checkInDays: number;
    reviewDone: boolean;
  };
  today: {
    dailyStartDone: boolean;
    eveningShutdownDone: boolean;
  };
  areas: MomentumArea[];
  warnings: MomentumWarning[];
  suggestions: MomentumSuggestion[];
}

export type RewardEventType =
  | 'task_completed'
  | 'habit_checked'
  | 'focus_completed'
  | 'daily_start'
  | 'evening_shutdown'
  | 'weekly_review'
  | 'quest_bonus'
  | 'daily_quests_complete';

export interface RewardEvent {
  id?: string;
  _id?: string;
  key: string;
  type: RewardEventType;
  xp: number;
  title: string;
  description?: string;
  date: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: string;
}

export interface DailyQuest {
  id: string;
  label: string;
  current: number;
  target: number;
  completed: boolean;
}

export interface QuestBonusAward {
  questId: string;
  xp: number;
}

export interface ProgressAward {
  duplicate: boolean;
  xp: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  streakBefore: number;
  streakAfter: number;
  streakFreezeUsed?: boolean;
  achievementsUnlocked: Achievement[];
  questBonuses?: QuestBonusAward[];
  allQuestsComplete?: boolean;
}

export interface UserProgress {
  totalXp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  dailyStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  streakFreezes: number;
  quests: DailyQuest[];
  achievements: Achievement[];
  recentEvents: RewardEvent[];
  awarded?: ProgressAward;
}

export interface RewardEventInput {
  type: RewardEventType;
  date?: string;
  entityId?: string;
  title?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export type DashboardWidgetKey = 'today' | 'momentum' | 'habits' | 'goals' | 'focus' | 'consistency' | 'insights';

export type AccentTheme = 'indigo' | 'emerald' | 'slate' | 'amber';

export interface UserPreferences {
  timezone: string;
  /** Local hour (0–23) to suggest Evening Shutdown */
  windDownHour?: number;
  weekStartDay: 0 | 1; // 0=Sun, 1=Mon
  defaultFocusDuration: number; // minutes
  dashboardWidgets: DashboardWidgetKey[];
  /** Display order for dashboard widgets (subset of dashboardWidgets) */
  widgetOrder?: DashboardWidgetKey[];
  /** Modules pinned to the top of the sidebar */
  pinnedModules?: ModuleKey[];
  accentTheme?: AccentTheme;
  notifications: {
    dailyReminders: boolean;
    habitStreakAlerts: boolean;
    goalDeadlineWarnings: boolean;
  };
  /** Tasks page UI state */
  tasksView?: {
    viewMode: 'list' | 'board';
    filterStatus: string;
    filterPriority: string;
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
  dashboardWidgets: ['today', 'momentum', 'habits', 'goals', 'focus', 'consistency', 'insights'],
  widgetOrder: ['today', 'momentum', 'habits', 'goals', 'focus', 'consistency', 'insights'],
  pinnedModules: [],
  accentTheme: 'indigo',
  notifications: {
    dailyReminders: true,
    habitStreakAlerts: true,
    goalDeadlineWarnings: true,
  },
};


