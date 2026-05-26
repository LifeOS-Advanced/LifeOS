import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMilestone {
  _id: Types.ObjectId;
  title: string;
  completed: boolean;
}

export interface IGoal extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number;
  milestones: IMilestone[];
  linkedTaskIds: Types.ObjectId[];
  linkedHabitIds: Types.ObjectId[];
  linkedNoteIds: Types.ObjectId[];
  lifeArea?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
  },
  { _id: true }
);

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    targetDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    milestones: { type: [MilestoneSchema], default: [] },
    linkedTaskIds: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    linkedHabitIds: [{ type: Schema.Types.ObjectId, ref: 'Habit' }],
    linkedNoteIds: [{ type: Schema.Types.ObjectId, ref: 'Note' }],
    lifeArea: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: Record<string, unknown>) => { delete r.__v; return r; } },
  }
);

GoalSchema.index({ userId: 1, progress: 1 });

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);
