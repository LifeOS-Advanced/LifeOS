import { describe, expect, it } from 'vitest';
import { buildCarryForwardFromNarrative, getLatestOpenCarryForward, nextWeekStart, updateCarryForwardStatus } from '@/lib/continuity';
import type { CarryForwardStatus, WeeklyNarrativeRecap, WeeklyReview } from '@/lib/types';

const baseReview = (weekStart: string, text: string, status: CarryForwardStatus = 'open'): WeeklyReview => ({
  id: weekStart,
  weekStart,
  wentWell: '',
  gotIgnored: '',
  improveNext: '',
  createdAt: `${weekStart}T00:00:00.000Z`,
  carryForward: {
    text,
    source: 'manual',
    status,
    createdFromWeekStart: weekStart,
    targetWeekStart: nextWeekStart(weekStart),
  },
});

describe('continuity carry-forward helpers', () => {
  it('builds a carry-forward thread from a weekly narrative', () => {
    const recap: WeeklyNarrativeRecap = {
      weekStart: '2026-05-18',
      weekEnd: '2026-05-24',
      weekLabel: 'Week of May 18',
      summary: '',
      identityReflection: '',
      unfinishedThread: 'Give Health one small action next.',
      strongestArea: null,
      neglectedArea: { area: 'health', label: 'Health', count: 0 },
      focusDistribution: [],
      stats: {
        tasksCompleted: 0,
        habitChecks: 0,
        focusMinutes: 0,
        focusSessions: 0,
        goalsMoved: 0,
        dailyStarts: 0,
        eveningShutdowns: 0,
        closedLoopDays: 0,
        meaningfulActionDays: 0,
        loopClosureRate: 0,
      },
    };

    expect(buildCarryForwardFromNarrative(recap)).toMatchObject({
      text: 'Give Health one small action next.',
      source: 'neglected_area',
      sourceArea: 'health',
      status: 'open',
      createdFromWeekStart: '2026-05-18',
      targetWeekStart: '2026-05-25',
    });
  });

  it('returns only the latest open carry-forward at or before the current week', () => {
    const reviews = [
      baseReview('2026-05-11', 'Old open thread'),
      baseReview('2026-05-18', 'Done thread', 'done'),
      baseReview('2026-05-25', 'Current open thread'),
      baseReview('2026-06-01', 'Future thread'),
    ];

    expect(getLatestOpenCarryForward(reviews, '2026-05-27')?.carryForward?.text).toBe('Current open thread');
  });

  it('hides done and dismissed carry-forward threads', () => {
    const reviews = [
      baseReview('2026-05-18', 'Dismissed thread', 'dismissed'),
      baseReview('2026-05-11', 'Done thread', 'done'),
    ];

    expect(getLatestOpenCarryForward(reviews, '2026-05-27')).toBeNull();
  });

  it('updates carry-forward status without changing the review body', () => {
    const review = baseReview('2026-05-18', 'Give Health one small action next.');
    const updated = updateCarryForwardStatus(review, 'dismissed');

    expect(updated.weekStart).toBe(review.weekStart);
    expect(updated.carryForward?.text).toBe(review.carryForward?.text);
    expect(updated.carryForward?.status).toBe('dismissed');
  });
});
