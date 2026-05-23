import { z } from 'zod';
import { toast } from 'sonner';

// Reusable primitives
const title = (max = 120) =>
  z.string().trim().min(1, 'Title is required').max(max, `Title must be under ${max} characters`);
const longText = (max = 5000) =>
  z.string().max(max, `Must be under ${max} characters`).optional().or(z.literal(''));
const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
  .optional()
  .or(z.literal(''));
const tagsCsv = z
  .string()
  .max(300, 'Too many tags')
  .optional()
  .or(z.literal(''));

// ---- Auth ----
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be under 255 characters');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be under 128 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be under 80 characters'),
  email: emailSchema,
  password: passwordSchema,
});

// ---- Tasks ----
export const taskFormSchema = z.object({
  title: title(120),
  description: longText(2000),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in-progress', 'done']),
  dueDate: dateStr,
  tags: tagsCsv,
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
}).refine(
  (v) => v.recurrence !== 'weekly' || (v.daysOfWeek && v.daysOfWeek.length > 0),
  { message: 'Pick at least one weekday for weekly recurrence', path: ['daysOfWeek'] },
);

// ---- Goals ----
export const goalFormSchema = z.object({
  title: title(120),
  description: longText(2000),
  targetDate: dateStr,
});

// ---- Habits ----
export const habitFormSchema = z.object({
  title: title(120),
  description: longText(1000),
  frequency: z.enum(['daily', 'weekly']),
});

// ---- Notes ----
export const noteFormSchema = z.object({
  title: title(160),
  content: z.string().max(50000, 'Note is too long').optional().or(z.literal('')),
  tags: tagsCsv,
  folder: z.string().trim().max(60, 'Folder name too long').optional().or(z.literal('')),
});

// ---- Helper: validate & toast first error ----
export function validateOrToast<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): z.infer<T> | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    toast.error(first?.message ?? 'Invalid input');
    return null;
  }
  return result.data;
}
