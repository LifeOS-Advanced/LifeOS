import mongoose, { Document, Schema, Types } from 'mongoose';

// ─── Note ────────────────────────────────────────────────────
export interface INote extends Document {
  userId: Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  taskId?: Types.ObjectId;
  goalId?: Types.ObjectId;
  lifeArea?: string;
  folder?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    content: { type: String, default: '', maxlength: 50000 },
    tags: { type: [String], default: [] },
    pinned: { type: Boolean, default: false },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
    lifeArea: { type: String },
    folder: { type: String, trim: true, maxlength: 60 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: any) => { delete r.__v; return r; } },
  }
);

NoteSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });
NoteSchema.index({ userId: 1, folder: 1 });
NoteSchema.index({ userId: 1, title: 'text', content: 'text' });

export const Note = mongoose.model<INote>('Note', NoteSchema);

// ─── FocusSession ────────────────────────────────────────────
export interface IFocusSession extends Document {
  userId: Types.ObjectId;
  label: string;
  sessionGoal?: string;
  duration: number;
  completedAt: string;
  distractionNotes?: string;
  interruptions?: number;
  taskId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FocusSessionSchema = new Schema<IFocusSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    sessionGoal: { type: String, trim: true, maxlength: 500 },
    duration: { type: Number, required: true, min: 1, max: 300 },
    completedAt: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    distractionNotes: { type: String, maxlength: 1000 },
    interruptions: { type: Number, min: 0, default: 0 },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: any) => { delete r.__v; return r; } },
  }
);

FocusSessionSchema.index({ userId: 1, completedAt: -1 });

export const FocusSession = mongoose.model<IFocusSession>('FocusSession', FocusSessionSchema);

// ─── DailyCheckIn ────────────────────────────────────────────
export interface IDailyCheckIn extends Document {
  userId: Types.ObjectId;
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 'low' | 'medium' | 'high';
  mainFocus: string;
  oneWord: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyCheckInSchema = new Schema<IDailyCheckIn>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    mood: { type: Number, required: true, enum: [1, 2, 3, 4, 5] },
    energy: { type: String, required: true, enum: ['low', 'medium', 'high'] },
    mainFocus: { type: String, required: true, trim: true, maxlength: 200 },
    oneWord: { type: String, required: true, trim: true, maxlength: 50 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: any) => { delete r.__v; return r; } },
  }
);

// One check-in per user per day
DailyCheckInSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyCheckIn = mongoose.model<IDailyCheckIn>('DailyCheckIn', DailyCheckInSchema);

// ─── WeeklyReview ────────────────────────────────────────────
export interface IWeeklyReview extends Document {
  userId: Types.ObjectId;
  weekStart: string;
  wentWell: string;
  gotIgnored: string;
  improveNext: string;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyReviewSchema = new Schema<IWeeklyReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    wentWell: { type: String, default: '', maxlength: 2000 },
    gotIgnored: { type: String, default: '', maxlength: 2000 },
    improveNext: { type: String, default: '', maxlength: 2000 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: any) => { delete r.__v; return r; } },
  }
);

// One review per user per week
WeeklyReviewSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const WeeklyReview = mongoose.model<IWeeklyReview>('WeeklyReview', WeeklyReviewSchema);

export interface IDailyStart extends Document {
  userId: Types.ObjectId;
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 'low' | 'medium' | 'high';
  mainPriority: string;
  topTaskIds: Types.ObjectId[];
  habitIds: Types.ObjectId[];
  suggestedFocusDuration: number;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DailyStartSchema = new Schema<IDailyStart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    mood: { type: Number, required: true, enum: [1, 2, 3, 4, 5] },
    energy: { type: String, required: true, enum: ['low', 'medium', 'high'] },
    mainPriority: { type: String, required: true, trim: true, maxlength: 200 },
    topTaskIds: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    habitIds: [{ type: Schema.Types.ObjectId, ref: 'Habit' }],
    suggestedFocusDuration: { type: Number, required: true, min: 5, max: 180 },
    confirmedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: any) => { delete r.__v; return r; } },
  }
);

DailyStartSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyStart = mongoose.model<IDailyStart>('DailyStart', DailyStartSchema);

export interface IEveningShutdown extends Document {
  userId: Types.ObjectId;
  date: string;
  completedTaskIds: Types.ObjectId[];
  delayedTaskIds: Types.ObjectId[];
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 'low' | 'medium' | 'high';
  wentWell: string;
  improveTomorrow: string;
  tomorrowFirstTask: string;
  createdAt: Date;
  updatedAt: Date;
}

const EveningShutdownSchema = new Schema<IEveningShutdown>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    completedTaskIds: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    delayedTaskIds: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    mood: { type: Number, required: true, enum: [1, 2, 3, 4, 5] },
    energy: { type: String, required: true, enum: ['low', 'medium', 'high'] },
    wentWell: { type: String, default: '', maxlength: 2000 },
    improveTomorrow: { type: String, default: '', maxlength: 2000 },
    tomorrowFirstTask: { type: String, default: '', maxlength: 200 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: any) => { delete r.__v; return r; } },
  }
);

EveningShutdownSchema.index({ userId: 1, date: 1 }, { unique: true });

export const EveningShutdown = mongoose.model<IEveningShutdown>('EveningShutdown', EveningShutdownSchema);

export type RewardEventType =
  | 'task_completed'
  | 'habit_checked'
  | 'focus_completed'
  | 'daily_start'
  | 'evening_shutdown'
  | 'weekly_review'
  | 'quest_bonus'
  | 'daily_quests_complete';

export interface IRewardEvent {
  _id: Types.ObjectId;
  key: string;
  type: RewardEventType;
  xp: number;
  title: string;
  description?: string;
  date: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IAchievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: Date;
}

export interface IUserProgress extends Document {
  userId: Types.ObjectId;
  totalXp: number;
  level: number;
  dailyStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  streakFreezes: number;
  eventKeys: string[];
  events: IRewardEvent[];
  achievements: IAchievement[];
  createdAt: Date;
  updatedAt: Date;
}

const RewardEventSchema = new Schema<IRewardEvent>(
  {
    key: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['task_completed', 'habit_checked', 'focus_completed', 'daily_start', 'evening_shutdown', 'weekly_review', 'quest_bonus', 'daily_quests_complete'],
    },
    xp: { type: Number, required: true, min: 0 },
    title: { type: String, required: true, maxlength: 160 },
    description: { type: String, maxlength: 500 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    entityId: { type: String },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const AchievementSchema = new Schema<IAchievement>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 300 },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    totalXp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    dailyStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastActivityDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
    streakFreezes: { type: Number, default: 0, min: 0, max: 3 },
    eventKeys: { type: [String], default: [] },
    events: { type: [RewardEventSchema], default: [] },
    achievements: { type: [AchievementSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: any) => { delete r.__v; return r; } },
  }
);

UserProgressSchema.index({ userId: 1, updatedAt: -1 });

export const UserProgress = mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);
