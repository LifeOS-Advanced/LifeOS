import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getNextLoopActionPreview, getNextQuestActionPreview } from '@/lib/daily-loop';
import { dataLayerTestUtils } from '@/lib/data-layer';
import { claimDailyClosureMoment } from '@/lib/reward-moments';
import { clampRewardVolume, getRewardSoundKind, playRewardSound } from '@/lib/reward-sounds';
import { DEFAULT_PREFERENCES, type DailyQuest } from '@/lib/types';

describe('reward sound preferences', () => {
  it('defaults reward sounds off with a quiet volume', () => {
    expect(DEFAULT_PREFERENCES.sensory.rewardSounds).toBe(false);
    expect(DEFAULT_PREFERENCES.sensory.soundVolume).toBe(0.35);
  });

  it('normalizes missing sensory preferences from API profiles', () => {
    const apiProfile = {
      name: 'Ada',
      email: 'ada@example.com',
      preferences: {
        notifications: {
          dailyReminders: false,
          habitStreakAlerts: true,
          goalDeadlineWarnings: true,
        },
      },
    } as unknown as Parameters<typeof dataLayerTestUtils.normalizeProfileFromApi>[0];
    const profile = dataLayerTestUtils.normalizeProfileFromApi(apiProfile);

    expect(profile.preferences?.sensory.rewardSounds).toBe(false);
    expect(profile.preferences?.sensory.soundVolume).toBe(0.35);
  });

  it('clamps unsafe volume values', () => {
    expect(clampRewardVolume(-1)).toBe(0);
    expect(clampRewardVolume(2)).toBe(1);
    expect(clampRewardVolume(Number.NaN)).toBe(0.35);
  });
});

describe('reward sound mapping', () => {
  it('maps meaningful reward events to calm sound kinds', () => {
    expect(getRewardSoundKind({ eventType: 'focus_completed' })).toBe('focus_lock');
    expect(getRewardSoundKind({ eventType: 'quest_bonus' })).toBe('quest_complete');
    expect(getRewardSoundKind({ dailyLoopClosed: true })).toBe('daily_closure');
    expect(getRewardSoundKind({ leveledUp: true })).toBe('level_up');
  });

  it('does not throw when Web Audio is unavailable', async () => {
    const previous = window.AudioContext;
    vi.stubGlobal('AudioContext', undefined);

    await expect(playRewardSound('quest_complete', 0.35, true)).resolves.toBeUndefined();
    await expect(playRewardSound(null, 0.35, true)).resolves.toBeUndefined();

    vi.stubGlobal('AudioContext', previous);
  });
});

describe('daily closure moments', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('can only be claimed once for a date', () => {
    expect(claimDailyClosureMoment('2026-05-25')).toBe(true);
    expect(claimDailyClosureMoment('2026-05-25')).toBe(false);
    expect(claimDailyClosureMoment('2026-05-26')).toBe(true);
  });
});

describe('loop anticipation helpers', () => {
  const quests: DailyQuest[] = [
    { id: 'daily_start_1', label: 'Plan your day', current: 1, target: 1, completed: true },
    { id: 'focus_1', label: 'Finish 1 focus sprint', current: 0, target: 1, completed: false },
  ];

  it('returns the next incomplete quest with XP and effort context', () => {
    expect(getNextQuestActionPreview(quests)).toEqual({
      label: 'Run a focus sprint',
      route: '/app/focus',
      xp: 20,
      estimate: '5-25 min',
    });
  });

  it('falls back to the hero action when quests are closed', () => {
    const preview = getNextLoopActionPreview(
      {
        phase: 'complete',
        title: 'Day complete',
        nextLine: 'view your progress',
        description: '',
        ctaLabel: 'View progress',
        route: '/app/progress',
      },
      quests.map(quest => ({ ...quest, completed: true, current: quest.target })),
    );

    expect(preview).toEqual({
      label: 'View progress',
      route: '/app/progress',
      estimate: '2 min',
    });
  });
});
