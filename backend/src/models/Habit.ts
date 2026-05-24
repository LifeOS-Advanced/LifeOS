import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IHabit extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  completedDates: string[];
  goalId?: Types.ObjectId;
  lifeArea?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    streak: { type: Number, default: 0, min: 0 },
    completedDates: { type: [String], default: [] },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
    lifeArea: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: any) => { delete r.__v; return r; } },
  }
);

HabitSchema.index({ userId: 1, goalId: 1 });

export const Habit = mongoose.model<IHabit>('Habit', HabitSchema);
