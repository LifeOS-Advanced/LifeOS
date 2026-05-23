import { Task, Habit, Goal, Note, FocusSession } from './types';
import { getTasks, setTasks, getHabits, setHabits, getGoals, setGoals, getNotes, setNotes, getFocusSessions, setFocusSessions } from './store';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

export const dummyTasks: Task[] = [
  { id: 't1', title: 'Review project proposal',  status: 'todo',        priority: 'high',   dueDate: today,     tags: ['work'],     lifeArea: 'work',     createdAt: twoDaysAgo },
  { id: 't2', title: 'Write blog post draft',    status: 'in-progress', priority: 'medium', dueDate: today,     tags: ['content'],  goalId: 'g1', lifeArea: 'projects', createdAt: twoDaysAgo },
  { id: 't3', title: 'Update portfolio website', status: 'todo',        priority: 'low',                       tags: ['personal'], lifeArea: 'personal', createdAt: yesterday },
  { id: 't4', title: 'Prepare presentation',     status: 'done',        priority: 'high',   dueDate: yesterday, tags: ['work'],     lifeArea: 'work',     createdAt: twoDaysAgo },
  { id: 't5', title: 'Research system design',   status: 'todo',        priority: 'medium',                    tags: ['learning'], goalId: 'g2', lifeArea: 'study',    createdAt: today },
  { id: 't6', title: 'Meal prep for the week',   status: 'in-progress', priority: 'medium', dueDate: today,     tags: ['health'],   goalId: 'g3', lifeArea: 'health',   createdAt: yesterday },
  { id: 't7', title: 'Build gym plan',           status: 'todo',        priority: 'high',   dueDate: today,     tags: ['health'],   goalId: 'g3', lifeArea: 'health',   createdAt: twoDaysAgo },
];

export const dummyHabits: Habit[] = [
  { id: 'h1', title: 'Morning meditation', frequency: 'daily',  streak: 12, completedDates: [today, yesterday, twoDaysAgo], lifeArea: 'personal', createdAt: twoDaysAgo },
  { id: 'h2', title: 'Read 30 minutes',    frequency: 'daily',  streak: 7,  completedDates: [yesterday, twoDaysAgo], goalId: 'g2', lifeArea: 'study', createdAt: twoDaysAgo },
  { id: 'h3', title: 'Workout',            frequency: 'daily',  streak: 5,  completedDates: [today, twoDaysAgo],     goalId: 'g3', lifeArea: 'health', createdAt: twoDaysAgo },
  { id: 'h4', title: 'Drink 2L water',     frequency: 'daily',  streak: 9,  completedDates: [today, yesterday],      goalId: 'g3', lifeArea: 'health', createdAt: yesterday },
  { id: 'h5', title: 'Sleep before 11pm',  frequency: 'daily',  streak: 4,  completedDates: [yesterday],             goalId: 'g3', lifeArea: 'health', createdAt: twoDaysAgo },
  { id: 'h6', title: 'Weekly review',      frequency: 'weekly', streak: 4,  completedDates: [yesterday], lifeArea: 'work', createdAt: twoDaysAgo },
];

export const dummyGoals: Goal[] = [
  { id: 'g1', title: 'Launch personal brand', description: 'Build an online presence with blog and social media', targetDate: '2026-06-30', progress: 40, milestones: [{ id: 'm1', title: 'Create blog', completed: true }, { id: 'm2', title: 'Write 10 posts', completed: false }, { id: 'm3', title: 'Reach 1k followers', completed: false }], linkedTaskIds: ['t2'], linkedHabitIds: [], linkedNoteIds: ['n1'], lifeArea: 'projects', createdAt: twoDaysAgo },
  { id: 'g2', title: 'Learn system design',   description: 'Master system design fundamentals for career growth',  targetDate: '2026-09-01', progress: 25, milestones: [{ id: 'm4', title: 'Complete online course', completed: true }, { id: 'm5', title: 'Build 3 projects', completed: false }], linkedTaskIds: ['t5'], linkedHabitIds: ['h2'], linkedNoteIds: ['n3'], lifeArea: 'study', createdAt: twoDaysAgo },
  { id: 'g3', title: 'Get fit in 90 days',    description: 'Build sustainable health habits and complete a half marathon', targetDate: '2026-07-15', progress: 30, milestones: [{ id: 'm6', title: 'Run 5K', completed: true }, { id: 'm7', title: 'Run 10K', completed: false }, { id: 'm8', title: 'Run 21K', completed: false }], linkedTaskIds: ['t6', 't7'], linkedHabitIds: ['h3', 'h4', 'h5'], linkedNoteIds: ['n5'], lifeArea: 'health', createdAt: twoDaysAgo },
];

export const dummyNotes: Note[] = [
  { id: 'n1', title: 'Brand strategy',          content: 'Voice: helpful, clear, opinionated. Topics: productivity, indie tools, side projects.', tags: ['ideas'],  pinned: true,  goalId: 'g1', lifeArea: 'projects', createdAt: twoDaysAgo, updatedAt: yesterday },
  { id: 'n2', title: 'Q2 planning notes',       content: 'Focus on user retention. Launch 2 new features. Improve onboarding flow.',                tags: ['work', 'meetings'], pinned: false, lifeArea: 'work', createdAt: yesterday, updatedAt: yesterday },
  { id: 'n3', title: 'Atomic Habits — notes',   content: '1% better every day. Habit stacking. Environment design. Identity-based habits.',         tags: ['books', 'learning'], pinned: true, goalId: 'g2', lifeArea: 'study', createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
  { id: 'n4', title: 'Weekly reflection',       content: 'Good week overall. Maintained exercise streak. Need deeper focus blocks.',                tags: ['reflection'], pinned: false, lifeArea: 'personal', createdAt: today, updatedAt: today },
  { id: 'n5', title: 'Workout & nutrition plan', content: '4x strength + 2x cardio per week. Protein 1.6g/kg. Meal prep Sundays.',                  tags: ['health'], pinned: true, goalId: 'g3', lifeArea: 'health', createdAt: twoDaysAgo, updatedAt: yesterday },
  { id: 'n6', title: 'Bug ideas',                content: 'Investigate retry loop in auth callback when token refresh races.', tags: ['dev'],     pinned: false, taskId: 't2', lifeArea: 'work', createdAt: yesterday, updatedAt: yesterday },
];

export const dummyFocusSessions: FocusSession[] = [
  { id: 'f1', label: 'Deep work — coding',    duration: 25, completedAt: today,     taskId: 't2' },
  { id: 'f2', label: 'Writing session',       duration: 25, completedAt: today,     taskId: 't2' },
  { id: 'f3', label: 'Meal planning',         duration: 50, completedAt: yesterday, taskId: 't6' },
  { id: 'f4', label: 'Design review',         duration: 25, completedAt: yesterday },
];

export function seedDummyData() {
  if (getTasks().length === 0) setTasks(dummyTasks);
  if (getHabits().length === 0) setHabits(dummyHabits);
  if (getGoals().length === 0) setGoals(dummyGoals);
  if (getNotes().length === 0) setNotes(dummyNotes);
  if (getFocusSessions().length === 0) setFocusSessions(dummyFocusSessions);
}
