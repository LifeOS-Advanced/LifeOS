import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubtask {
  _id: Types.ObjectId;
  title: string;
  done: boolean;
}

export interface IRecurrenceRule {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[];
}

export interface ITask extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  importance: number;
  urgency: number;
  effort: number;
  energyRequired: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
  goalId?: Types.ObjectId;
  lifeArea?: string;
  subtasks: ISubtask[];
  recurrence?: IRecurrenceRule;
  lastGeneratedDate?: string;
  recurrenceParentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubtaskSchema = new Schema<ISubtask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    done: { type: Boolean, default: false },
  },
  { _id: true }
);

const RecurrenceSchema = new Schema<IRecurrenceRule>(
  {
    frequency: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], required: true },
    daysOfWeek: { type: [Number], default: undefined },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    importance: { type: Number, min: 1, max: 5, default: 3 },
    urgency: { type: Number, min: 1, max: 5, default: 3 },
    effort: { type: Number, min: 1, max: 5, default: 3 },
    energyRequired: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
    tags: { type: [String], default: [] },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
    lifeArea: { type: String },
    subtasks: { type: [SubtaskSchema], default: [] },
    recurrence: { type: RecurrenceSchema },
    lastGeneratedDate: { type: String },
    recurrenceParentId: { type: Schema.Types.ObjectId, ref: 'Task' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: any) => { delete r.__v; return r; } },
  }
);

TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, goalId: 1 });
TaskSchema.index({ userId: 1, importance: -1, urgency: -1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
