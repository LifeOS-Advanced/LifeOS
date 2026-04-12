export type LifestyleMode = 'student' | 'freelancer' | 'employee' | 'creator' | 'personal-growth';

export type ModuleKey = 'tasks' | 'habits' | 'goals' | 'notes' | 'focus';

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
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  label: string;
  duration: number; // minutes
  completedAt: string;
  distractionNotes?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  lifestyleMode: LifestyleMode;
  enabledModules: ModuleKey[];
  theme: 'light' | 'dark' | 'system';
}
