export type LifestyleMode = 'student' | 'freelancer' | 'employee' | 'creator' | 'personal-growth';

export type ModuleKey = 'tasks' | 'habits' | 'goals' | 'notes' | 'focus';

export type ImprovementArea = 'discipline' | 'studying' | 'productivity' | 'health' | 'money' | 'focus';
export type DayIntensity = 'light' | 'moderate' | 'intense';

export type LifeArea = 'work' | 'study' | 'health' | 'money' | 'personal' | 'family' | 'faith' | 'projects';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

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
  content: string;
  tags: string[];
  pinned: boolean;
  taskId?: string;
  goalId?: string;
  lifeArea?: LifeArea;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  label: string;
  duration: number; // minutes
  completedAt: string;
  distractionNotes?: string;
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

export interface UserProfile {
  name: string;
  email: string;
  lifestyleMode: LifestyleMode;
  enabledModules: ModuleKey[];
  theme: 'light' | 'dark' | 'system';
  improvementFocus?: ImprovementArea[];
  dayIntensity?: DayIntensity;
  dashboardPriority?: ModuleKey;
}
