import { describe, expect, it } from 'vitest';
import { buildIdentityMessage, buildWeeklyNarrative, buildWhyThisMatters } from '@/lib/identity';
import type { DailyStart, EveningShutdown, Goal, Habit, Task, UserProfile } from '@/lib/types';

const profile: UserProfile = {
  name: 'Alex',
  lifestyleMode: 'personal-growth',
  improvementFocus: ['discipline'],
  dayIntensity: 'moderate',
  preferredModules: ['tasks', 'habits', 'focus'],
  dashboardPriority: 'balanced',
  onboarded: true,
  preferences: {
    dashboardWidgets: ['today', 'habits', 'goals', 'focus', 'consistency', 'insights', 'momentum'],
    widgetOrder: ['today', 'habits', 'goals', 'focus', 'consistency', 'insights', 'momentum'],
    theme: 'system',
    timezone: 'UTC',
    notifications: { dailyReview: true, habitReminders: true, weeklyReview: true },
  },
};

describe('identity reward language', () => {
  it('uses evidence-first copy for meaningful actions', () => {
    expect(buildIdentityMessage('focus_completed')).toBe('Focus session completed.');
    expect(buildIdentityMessage('weekly_review')).toBe('Weekly review saved.');
  });

  it('only explains why an action matters when context exists', () => {
    expect(buildWhyThisMatters({ type: 'task_completed' })).toBeNull();
    expect(buildWhyThisMatters({ type: 'task_completed', profile })).toBeNull();
    expect(buildWhyThisMatters({ type: 'task_completed', lifeArea: 'health', profile })).toBe('This moved Health forward today.');
    expect(buildWhyThisMatters({ type: 'task_completed', goalTitle: 'Build emergency fund', lifeArea: 'money', profile })).toBe('This contributed to your Build emergency fund goal.');
    expect(buildWhyThisMatters({ type: 'evening_shutdown', mainPriority: 'Train' })).toBe('This connected back to today’s priority: Train.');
  });

  it('does not make absolute trait claims', () => {
    const messages = [
      buildIdentityMessage('task_completed'),
      buildIdentityMessage('habit_checked'),
      buildIdentityMessage('focus_completed'),
      buildIdentityMessage('daily_start'),
      buildIdentityMessage('evening_shutdown'),
      buildIdentityMessage('weekly_review'),
    ];

    expect(messages.join(' ')).not.toMatch(/you are disciplined|you are productive|you are focused/i);
  });
});

describe('weekly narrative recap', () => {
  it('returns a useful low-data story without inventing activity', () => {
    const recap = buildWeeklyNarrative({
      tasks: [],
      habits: [],
      goals: [],
      notes: [],
      sessions: [],
      dailyStarts: [],
      eveningShutdowns: [],
      reviews: [],
      weekStart: '2026-05-25',
      progressEvents: [],
    });

    expect(recap.stats.closedLoopDays).toBe(0);
    expect(recap.strongestArea).toBeNull();
    expect(recap.summary).toContain('has not built a clear story yet');
  });

  it('counts loop closure only when start, meaningful work, and shutdown exist', () => {
    const task: Task = {
      id: 'task-1',
      title: 'Protect workout',
      status: 'done',
      priority: 'high',
      importance: 5,
      urgency: 4,
      effort: 2,
      energyRequired: 'medium',
      tags: [],
      lifeArea: 'health',
      goalId: 'goal-1',
      createdAt: '2026-05-25T10:00:00.000Z',
    };
    const habit: Habit = {
      id: 'habit-1',
      title: 'Read',
      frequency: 'daily',
      streak: 2,
      completedDates: ['2026-05-25', '2026-05-26'],
      lifeArea: 'study',
      createdAt: '2026-05-20T10:00:00.000Z',
    };
    const goal: Goal = {
      id: 'goal-1',
      title: 'Health base',
      progress: 20,
      milestones: [],
      linkedTaskIds: ['task-1'],
      linkedHabitIds: [],
      linkedNoteIds: [],
      lifeArea: 'health',
      createdAt: '2026-05-20T10:00:00.000Z',
    };
    const dailyStarts: DailyStart[] = [
      { id: 'start-1', date: '2026-05-25', mood: 4, energy: 'medium', mainPriority: 'Train', topTaskIds: [], habitIds: [], suggestedFocusDuration: 25 },
      { id: 'start-2', date: '2026-05-26', mood: 4, energy: 'medium', mainPriority: 'Read', topTaskIds: [], habitIds: [], suggestedFocusDuration: 25 },
    ];
    const eveningShutdowns: EveningShutdown[] = [
      { id: 'stop-1', date: '2026-05-25', completedTaskIds: ['task-1'], delayedTaskIds: [], mood: 4, energy: 'medium', wentWell: '', improveTomorrow: '', tomorrowFirstTask: '' },
      { id: 'stop-2', date: '2026-05-26', completedTaskIds: [], delayedTaskIds: [], mood: 4, energy: 'medium', wentWell: '', improveTomorrow: '', tomorrowFirstTask: '' },
    ];

    const recap = buildWeeklyNarrative({
      tasks: [task],
      habits: [habit],
      goals: [goal],
      notes: [{
        id: 'note-1',
        title: 'Family idea',
        content: '',
        tags: [],
        pinned: false,
        lifeArea: 'family',
        createdAt: '2026-05-20T10:00:00.000Z',
        updatedAt: '2026-05-20T10:00:00.000Z',
      }],
      sessions: [],
      dailyStarts,
      eveningShutdowns,
      reviews: [],
      weekStart: '2026-05-25',
      progressEvents: [{ type: 'task_completed', date: '2026-05-25' }],
    });

    expect(recap.stats.closedLoopDays).toBe(1);
    expect(recap.stats.loopClosureRate).toBe(50);
    expect(recap.strongestArea?.area).toBe('health');
    expect(recap.unfinishedThread).toBe('Give Health base one small next action.');
  });

  it('uses neglected areas before generic carry-forward copy when no paused goal exists', () => {
    const recap = buildWeeklyNarrative({
      tasks: [{
        id: 'task-1',
        title: 'Ship work task',
        status: 'done',
        priority: 'medium',
        importance: 3,
        urgency: 3,
        effort: 2,
        energyRequired: 'medium',
        tags: [],
        lifeArea: 'work',
        createdAt: '2026-05-25T10:00:00.000Z',
      }],
      habits: [],
      goals: [{
        id: 'goal-1',
        title: 'Family rhythm',
        progress: 0,
        milestones: [],
        linkedTaskIds: [],
        linkedHabitIds: [],
        linkedNoteIds: [],
        lifeArea: 'family',
        createdAt: '2026-05-20T10:00:00.000Z',
      }],
      notes: [],
      sessions: [],
      dailyStarts: [],
      eveningShutdowns: [],
      reviews: [],
      weekStart: '2026-05-25',
      progressEvents: [{ type: 'task_completed', date: '2026-05-25' }],
    });

    expect(recap.neglectedArea?.area).toBe('family');
    expect(recap.unfinishedThread).toBe('Give Family one small action next.');
  });

  it('falls back to weekly review when there is no stronger unfinished thread', () => {
    const recap = buildWeeklyNarrative({
      tasks: [{
        id: 'task-1',
        title: 'Ship work task',
        status: 'done',
        priority: 'medium',
        importance: 3,
        urgency: 3,
        effort: 2,
        energyRequired: 'medium',
        tags: [],
        lifeArea: 'work',
        createdAt: '2026-05-25T10:00:00.000Z',
      }],
      habits: [],
      goals: [],
      notes: [],
      sessions: [],
      dailyStarts: [],
      eveningShutdowns: [],
      reviews: [],
      weekStart: '2026-05-25',
      progressEvents: [{ type: 'task_completed', date: '2026-05-25' }],
    });

    expect(recap.unfinishedThread).toBe('Close this week with a short review.');
  });
});
