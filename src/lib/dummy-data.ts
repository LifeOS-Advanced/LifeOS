import { Task, Habit, Goal, Note, FocusSession } from './types';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

export const dummyTasks: Task[] = [
  { id: 't1', title: 'Review project proposal', status: 'todo', priority: 'high', dueDate: today, tags: ['work'], createdAt: twoDaysAgo },
  { id: 't2', title: 'Write blog post draft', status: 'in-progress', priority: 'medium', dueDate: today, tags: ['content'], goalId: 'g1', createdAt: twoDaysAgo },
  { id: 't3', title: 'Update portfolio website', status: 'todo', priority: 'low', tags: ['personal'], createdAt: yesterday },
  { id: 't4', title: 'Prepare presentation slides', status: 'done', priority: 'high', dueDate: yesterday, tags: ['work'], createdAt: twoDaysAgo },
  { id: 't5', title: 'Research new frameworks', status: 'todo', priority: 'medium', tags: ['learning'], goalId: 'g2', createdAt: today },
  { id: 't6', title: 'Fix API integration bug', status: 'in-progress', priority: 'high', tags: ['dev'], createdAt: yesterday },
];

export const dummyHabits: Habit[] = [
  { id: 'h1', title: 'Morning meditation', frequency: 'daily', streak: 12, completedDates: [today, yesterday, twoDaysAgo], createdAt: twoDaysAgo },
  { id: 'h2', title: 'Read 30 minutes', frequency: 'daily', streak: 7, completedDates: [yesterday, twoDaysAgo], goalId: 'g2', createdAt: twoDaysAgo },
  { id: 'h3', title: 'Exercise', frequency: 'daily', streak: 5, completedDates: [today, twoDaysAgo], createdAt: twoDaysAgo },
  { id: 'h4', title: 'Write journal', frequency: 'daily', streak: 3, completedDates: [today], createdAt: yesterday },
  { id: 'h5', title: 'Weekly review', frequency: 'weekly', streak: 4, completedDates: [yesterday], createdAt: twoDaysAgo },
];

export const dummyGoals: Goal[] = [
  { id: 'g1', title: 'Launch personal brand', description: 'Build an online presence with blog and social media', targetDate: '2026-06-30', progress: 40, milestones: [{ id: 'm1', title: 'Create blog', completed: true }, { id: 'm2', title: 'Write 10 posts', completed: false }, { id: 'm3', title: 'Reach 1k followers', completed: false }], linkedTaskIds: ['t2'], linkedHabitIds: [], createdAt: twoDaysAgo },
  { id: 'g2', title: 'Learn system design', description: 'Master system design fundamentals for career growth', targetDate: '2026-09-01', progress: 25, milestones: [{ id: 'm4', title: 'Complete online course', completed: true }, { id: 'm5', title: 'Build 3 projects', completed: false }], linkedTaskIds: ['t5'], linkedHabitIds: ['h2'], createdAt: twoDaysAgo },
  { id: 'g3', title: 'Run a half marathon', description: 'Train and complete a half marathon', targetDate: '2026-10-15', progress: 15, milestones: [{ id: 'm6', title: 'Run 5K', completed: true }, { id: 'm7', title: 'Run 10K', completed: false }, { id: 'm8', title: 'Run 21K', completed: false }], linkedTaskIds: [], linkedHabitIds: ['h3'], createdAt: twoDaysAgo },
];

export const dummyNotes: Note[] = [
  { id: 'n1', title: 'Project ideas', content: 'Build a habit tracker with AI suggestions. Create a minimal note-taking app with markdown support.', tags: ['ideas'], pinned: true, createdAt: twoDaysAgo, updatedAt: yesterday },
  { id: 'n2', title: 'Meeting notes - Q2 planning', content: 'Focus on user retention. Launch 2 new features. Improve onboarding flow.', tags: ['work', 'meetings'], pinned: false, createdAt: yesterday, updatedAt: yesterday },
  { id: 'n3', title: 'Book notes: Atomic Habits', content: 'Key takeaways: 1% better every day. Habit stacking. Environment design. Identity-based habits.', tags: ['books', 'learning'], pinned: true, createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
  { id: 'n4', title: 'Weekly reflection', content: 'Good week overall. Maintained exercise streak. Need to improve focus during deep work sessions.', tags: ['reflection'], pinned: false, createdAt: today, updatedAt: today },
];

export const dummyFocusSessions: FocusSession[] = [
  { id: 'f1', label: 'Deep work - coding', duration: 25, completedAt: today },
  { id: 'f2', label: 'Writing session', duration: 25, completedAt: today },
  { id: 'f3', label: 'Research', duration: 50, completedAt: yesterday },
  { id: 'f4', label: 'Design review', duration: 25, completedAt: yesterday },
];

export function seedDummyData() {
  const { getTasks, setTasks, getHabits, setHabits, getGoals, setGoals, getNotes, setNotes, getFocusSessions, setFocusSessions } = require('./store');
  if (getTasks().length === 0) setTasks(dummyTasks);
  if (getHabits().length === 0) setHabits(dummyHabits);
  if (getGoals().length === 0) setGoals(dummyGoals);
  if (getNotes().length === 0) setNotes(dummyNotes);
  if (getFocusSessions().length === 0) setFocusSessions(dummyFocusSessions);
}
