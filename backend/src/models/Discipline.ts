import mongoose, { Document, Schema, Types } from 'mongoose';

export type DisciplineTargetStatus = 'active' | 'paused' | 'archived';
export type ReplacementActionCategory =
  | 'body'
  | 'breathing'
  | 'environment'
  | 'reflection'
  | 'focus'
  | 'social'
  | 'custom';
export type UrgeOutcome = 'interrupted' | 'delayed' | 'relapsed';

export interface IDisciplineTarget extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  identityStatement?: string;
  status: DisciplineTargetStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReplacementAction extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  category: ReplacementActionCategory;
  durationMinutes: number;
  targetId?: Types.ObjectId;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRelapseReview {
  whatHappened?: string;
  whatTriggered?: string;
  nextChange?: string;
  nextReplacementActionId?: Types.ObjectId;
  reviewedAt?: Date;
}

export interface IUrgeLog extends Document {
  userId: Types.ObjectId;
  targetId?: Types.ObjectId;
  replacementActionId?: Types.ObjectId;
  intensity: number;
  trigger: string;
  emotion: string;
  context?: string;
  location?: string;
  outcome: UrgeOutcome;
  replacementCompleted: boolean;
  notes?: string;
  occurredAt: Date;
  review?: IRelapseReview;
  createdAt: Date;
  updatedAt: Date;
}

const DisciplineTargetSchema = new Schema<IDisciplineTarget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    identityStatement: { type: String, trim: true, maxlength: 240 },
    status: { type: String, enum: ['active', 'paused', 'archived'], default: 'active', index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: Record<string, unknown>) => { delete r.__v; return r; } },
  }
);

DisciplineTargetSchema.index({ userId: 1, status: 1, createdAt: -1 });

const ReplacementActionSchema = new Schema<IReplacementAction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    category: {
      type: String,
      enum: ['body', 'breathing', 'environment', 'reflection', 'focus', 'social', 'custom'],
      default: 'custom',
      index: true,
    },
    durationMinutes: { type: Number, default: 2, min: 1, max: 120 },
    targetId: { type: Schema.Types.ObjectId, ref: 'DisciplineTarget' },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: Record<string, unknown>) => { delete r.__v; return r; } },
  }
);

ReplacementActionSchema.index({ userId: 1, targetId: 1 });
ReplacementActionSchema.index({ userId: 1, category: 1, createdAt: -1 });

const RelapseReviewSchema = new Schema<IRelapseReview>(
  {
    whatHappened: { type: String, trim: true, maxlength: 2000 },
    whatTriggered: { type: String, trim: true, maxlength: 1000 },
    nextChange: { type: String, trim: true, maxlength: 1000 },
    nextReplacementActionId: { type: Schema.Types.ObjectId, ref: 'ReplacementAction' },
    reviewedAt: { type: Date },
  },
  { _id: false }
);

const UrgeLogSchema = new Schema<IUrgeLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, ref: 'DisciplineTarget' },
    replacementActionId: { type: Schema.Types.ObjectId, ref: 'ReplacementAction' },
    intensity: { type: Number, required: true, min: 1, max: 10 },
    trigger: { type: String, required: true, trim: true, maxlength: 80 },
    emotion: { type: String, required: true, trim: true, maxlength: 80 },
    context: { type: String, trim: true, maxlength: 160 },
    location: { type: String, trim: true, maxlength: 120 },
    outcome: { type: String, enum: ['interrupted', 'delayed', 'relapsed'], required: true, index: true },
    replacementCompleted: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: 2000 },
    occurredAt: { type: Date, default: Date.now, index: true },
    review: { type: RelapseReviewSchema },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, r: Record<string, unknown>) => { delete r.__v; return r; } },
  }
);

UrgeLogSchema.index({ userId: 1, occurredAt: -1 });
UrgeLogSchema.index({ userId: 1, trigger: 1 });
UrgeLogSchema.index({ userId: 1, emotion: 1 });
UrgeLogSchema.index({ userId: 1, context: 1 });

export const DisciplineTarget = mongoose.model<IDisciplineTarget>('DisciplineTarget', DisciplineTargetSchema);
export const ReplacementAction = mongoose.model<IReplacementAction>('ReplacementAction', ReplacementActionSchema);
export const UrgeLog = mongoose.model<IUrgeLog>('UrgeLog', UrgeLogSchema);
