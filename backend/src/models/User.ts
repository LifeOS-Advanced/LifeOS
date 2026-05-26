import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type LifestyleMode = 'student' | 'freelancer' | 'employee' | 'creator' | 'personal-growth';
export type ModuleKey = 'tasks' | 'habits' | 'goals' | 'notes' | 'focus' | 'discipline';
export type AccentTheme = 'indigo' | 'emerald' | 'slate' | 'amber';
export type DashboardWidgetKey = 'today' | 'momentum' | 'habits' | 'goals' | 'focus' | 'consistency' | 'insights' | 'discipline';

export interface IUserPreferences {
  timezone: string;
  weekStartDay: 0 | 1;
  defaultFocusDuration: number;
  dashboardWidgets: DashboardWidgetKey[];
  widgetOrder: DashboardWidgetKey[];
  pinnedModules: ModuleKey[];
  accentTheme: AccentTheme;
  notifications: {
    dailyReminders: boolean;
    habitStreakAlerts: boolean;
    goalDeadlineWarnings: boolean;
    browserEnabled?: boolean;
    morningReminderTime?: string;
    eveningReminderTime?: string;
    weeklyReviewReminder?: boolean;
  };
  sensory: {
    rewardSounds: boolean;
    soundVolume: number;
  };
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  provider: 'local' | 'google' | 'github';
  providerId?: string;
  avatar?: string;
  lifestyleMode: LifestyleMode;
  enabledModules: ModuleKey[];
  theme: 'light' | 'dark' | 'system';
  improvementFocus: string[];
  dayIntensity: 'light' | 'moderate' | 'intense';
  dashboardPriority: ModuleKey;
  preferences: IUserPreferences;
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const PreferencesSchema = new Schema<IUserPreferences>(
  {
    timezone: { type: String, default: 'UTC' },
    weekStartDay: { type: Number, enum: [0, 1], default: 1 },
    defaultFocusDuration: { type: Number, default: 25, min: 5, max: 180 },
    dashboardWidgets: {
      type: [String],
      default: ['today', 'momentum', 'habits', 'goals', 'focus', 'discipline', 'consistency', 'insights'],
    },
    widgetOrder: {
      type: [String],
      default: ['today', 'momentum', 'habits', 'goals', 'focus', 'discipline', 'consistency', 'insights'],
    },
    pinnedModules: { type: [String], default: [] },
    accentTheme: { type: String, enum: ['indigo', 'emerald', 'slate', 'amber'], default: 'indigo' },
    notifications: {
      dailyReminders: { type: Boolean, default: true },
      habitStreakAlerts: { type: Boolean, default: true },
      goalDeadlineWarnings: { type: Boolean, default: true },
      browserEnabled: { type: Boolean, default: false },
      morningReminderTime: { type: String, default: '08:30' },
      eveningReminderTime: { type: String, default: '20:30' },
      weeklyReviewReminder: { type: Boolean, default: true },
    },
    sensory: {
      rewardSounds: { type: Boolean, default: false },
      soundVolume: { type: Number, default: 0.35, min: 0, max: 1 },
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: { type: String, select: false },
    provider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
    providerId: { type: String, sparse: true },
    avatar: { type: String },
    lifestyleMode: {
      type: String,
      enum: ['student', 'freelancer', 'employee', 'creator', 'personal-growth'],
      default: 'personal-growth',
    },
    enabledModules: {
      type: [String],
      default: ['tasks', 'habits', 'goals', 'notes', 'focus', 'discipline'],
    },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    improvementFocus: { type: [String], default: [] },
    dayIntensity: { type: String, enum: ['light', 'moderate', 'intense'], default: 'moderate' },
    dashboardPriority: { type: String, default: 'tasks' },
    preferences: { type: PreferencesSchema, default: () => ({}) },
    refreshTokens: { type: [String], select: false, default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as any).password;
        delete (ret as any).refreshTokens;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Indexes
UserSchema.index({ provider: 1, providerId: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
