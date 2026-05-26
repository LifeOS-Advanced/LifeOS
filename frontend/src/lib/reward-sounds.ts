import type { RewardToastIntensity, RewardToastVariant } from './reward-toast';

export type RewardSoundKind =
  | 'soft_tick'
  | 'quest_complete'
  | 'focus_lock'
  | 'daily_closure'
  | 'level_up';

type AudioContextCtor = typeof AudioContext;

type OscStep = {
  frequency: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
};

const SOUND_STEPS: Record<RewardSoundKind, OscStep[]> = {
  soft_tick: [
    { frequency: 660, start: 0, duration: 0.075, type: 'sine', gain: 0.34 },
    { frequency: 880, start: 0.055, duration: 0.09, type: 'triangle', gain: 0.22 },
  ],
  quest_complete: [
    { frequency: 523.25, start: 0, duration: 0.09, type: 'sine', gain: 0.3 },
    { frequency: 659.25, start: 0.07, duration: 0.11, type: 'sine', gain: 0.26 },
    { frequency: 783.99, start: 0.15, duration: 0.13, type: 'triangle', gain: 0.2 },
  ],
  focus_lock: [
    { frequency: 392, start: 0, duration: 0.12, type: 'triangle', gain: 0.25 },
    { frequency: 587.33, start: 0.09, duration: 0.16, type: 'sine', gain: 0.22 },
  ],
  daily_closure: [
    { frequency: 440, start: 0, duration: 0.12, type: 'sine', gain: 0.26 },
    { frequency: 554.37, start: 0.1, duration: 0.16, type: 'sine', gain: 0.23 },
    { frequency: 739.99, start: 0.22, duration: 0.2, type: 'triangle', gain: 0.18 },
  ],
  level_up: [
    { frequency: 523.25, start: 0, duration: 0.1, type: 'triangle', gain: 0.27 },
    { frequency: 659.25, start: 0.085, duration: 0.12, type: 'triangle', gain: 0.25 },
    { frequency: 880, start: 0.19, duration: 0.18, type: 'sine', gain: 0.2 },
  ],
};

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext ?? null;
}

export function clampRewardVolume(volume?: number): number {
  if (!Number.isFinite(volume)) return 0.35;
  return Math.max(0, Math.min(1, Number(volume)));
}

export function getRewardSoundKind(opts: {
  eventType?: string;
  variant?: RewardToastVariant;
  intensity?: RewardToastIntensity;
  leveledUp?: boolean;
  streakMilestone?: boolean;
  allQuestsComplete?: boolean;
  dailyLoopClosed?: boolean;
}): RewardSoundKind | null {
  if (opts.leveledUp || opts.streakMilestone || opts.variant === 'level' || opts.variant === 'achievement') {
    return 'level_up';
  }
  if (opts.dailyLoopClosed || opts.allQuestsComplete || opts.eventType === 'daily_quests_complete' || opts.variant === 'loop') {
    return 'daily_closure';
  }
  if (opts.eventType === 'focus_completed' || opts.variant === 'focus') return 'focus_lock';
  if (opts.eventType === 'quest_bonus' || opts.variant === 'quest') return 'quest_complete';
  if (opts.intensity === 'high') return 'quest_complete';
  if (opts.eventType || opts.variant === 'xp') return 'soft_tick';
  return null;
}

export async function playRewardSound(
  kind: RewardSoundKind | null | undefined,
  volume = 0.35,
  enabled = true,
): Promise<void> {
  try {
    if (!enabled || !kind) return;
    const AudioCtor = getAudioContextCtor();
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => undefined);
    }

    const master = ctx.createGain();
    master.gain.setValueAtTime(clampRewardVolume(volume) * 0.28, ctx.currentTime);
    master.connect(ctx.destination);

    const steps = SOUND_STEPS[kind];
    const endAt = steps.reduce((max, step) => Math.max(max, step.start + step.duration), 0);

    steps.forEach((step) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + step.start;
      const end = start + step.duration;

      osc.type = step.type ?? 'sine';
      osc.frequency.setValueAtTime(step.frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(step.gain ?? 0.24, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(end + 0.02);
    });

    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, Math.ceil((endAt + 0.2) * 1000));
  } catch {
    // Sound is sensory polish only; unsupported audio must never break reward flow.
  }
}
