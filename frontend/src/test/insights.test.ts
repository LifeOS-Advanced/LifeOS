import { describe, it, expect } from 'vitest';
import { consecutiveHabitStreak, computeConsistency } from '@/lib/insights';
import type { Habit, FocusSession, Goal } from '@/lib/types';

describe('consecutiveHabitStreak', () => {
  it('counts consecutive days ending today', () => {
    const today = '2026-05-25';
    const dates = ['2026-05-25', '2026-05-24', '2026-05-23'];
    expect(consecutiveHabitStreak(dates, today)).toBe(3);
  });

  it('stops at first gap', () => {
    const today = '2026-05-25';
    const dates = ['2026-05-25', '2026-05-23'];
    expect(consecutiveHabitStreak(dates, today)).toBe(1);
  });
});

describe('computeConsistency', () => {
  it('returns zeros for empty inputs', () => {
    const stats = computeConsistency([], [], [], []);
    expect(stats.weeklyScore).toBe(0);
    expect(stats.bestHabitStreak).toBe(0);
  });

  it('uses consecutive streak for habits', () => {
    const today = new Date().toISOString().split('T')[0];
    const habits: Habit[] = [{
      id: 'h1',
      title: 'Meditate',
      frequency: 'daily',
      streak: 0,
      completedDates: [today],
      createdAt: new Date().toISOString(),
    }];
    const stats = computeConsistency(habits, [] as FocusSession[], [] as Goal[], []);
    expect(stats.bestHabitStreak).toBeGreaterThanOrEqual(1);
  });
});
