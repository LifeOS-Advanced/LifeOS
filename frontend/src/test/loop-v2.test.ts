import { beforeEach, describe, expect, it } from 'vitest';
import { questMeta, questRoute } from '@/lib/daily-loop';
import { recordLocalProgressEvent } from '@/lib/progress';
import type { DailyQuest } from '@/lib/types';

describe('Loop V2 quest guidance', () => {
  it('links daily quests to the product surface that teaches the action', () => {
    const quest: DailyQuest = { id: 'focus_1', label: 'Finish 1 focus sprint', current: 0, target: 1, completed: false };

    expect(questRoute(quest)).toBe('/app/focus');
    expect(questMeta(quest).action).toBe('Run a focus sprint');
  });
});

describe('local progress idempotency', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not award habit XP twice for the same habit date key', () => {
    const first = recordLocalProgressEvent({
      type: 'habit_checked',
      date: '2026-05-25',
      entityId: 'habit-1',
      metadata: { key: 'habit_checked:habit-1:2026-05-25' },
    });
    const duplicate = recordLocalProgressEvent({
      type: 'habit_checked',
      date: '2026-05-25',
      entityId: 'habit-1',
      metadata: { key: 'habit_checked:habit-1:2026-05-25' },
    });

    expect(first.awarded?.xp).toBe(15);
    expect(duplicate.awarded?.duplicate).toBe(true);
    expect(duplicate.totalXp).toBe(first.totalXp);
  });

  it('allows the same habit to count again on a new day', () => {
    const dayOne = recordLocalProgressEvent({
      type: 'habit_checked',
      date: '2026-05-25',
      entityId: 'habit-1',
      metadata: { key: 'habit_checked:habit-1:2026-05-25' },
    });
    const dayTwo = recordLocalProgressEvent({
      type: 'habit_checked',
      date: '2026-05-26',
      entityId: 'habit-1',
      metadata: { key: 'habit_checked:habit-1:2026-05-26' },
    });

    expect(dayTwo.awarded?.duplicate).toBe(false);
    expect(dayTwo.totalXp).toBeGreaterThan(dayOne.totalXp);
  });
});
