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