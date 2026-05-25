import { Types } from 'mongoose';
import { AnalyticsEvent, AnalyticsEventType } from '../models/Index';

export interface TrackAnalyticsInput {
  userId: Types.ObjectId | string;
  type: AnalyticsEventType;
  occurredAt?: Date;
  dateKey?: string;
  sessionId?: string;
  source?: 'frontend' | 'backend';
  metadata?: Record<string, unknown>;
}

export const analyticsDateKey = (date = new Date()) => date.toISOString().split('T')[0];

export async function trackAnalyticsEvent(input: TrackAnalyticsInput) {
  const occurredAt = input.occurredAt ?? new Date();
  return AnalyticsEvent.create({
    userId: input.userId,
    type: input.type,
    occurredAt,
    dateKey: input.dateKey ?? analyticsDateKey(occurredAt),
    sessionId: input.sessionId,
    source: input.source ?? 'frontend',
    metadata: input.metadata,
  });
}

export async function trackAnalyticsEventSafe(input: TrackAnalyticsInput) {
  try {
    await trackAnalyticsEvent(input);
  } catch {
    // Analytics must never block the core productivity flow.
  }
}

export async function getUserAnalyticsSummary(userId: Types.ObjectId | string) {
  const events = await AnalyticsEvent.find({ userId })
    .sort('-occurredAt')
    .limit(500)
    .lean();

  const byType = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.type] = (acc[event.type] ?? 0) + 1;
    return acc;
  }, {});

  const signup = [...events].reverse().find((event) => event.type === 'signup_completed');
  const firstXp = [...events].reverse().find((event) => event.type === 'first_xp_earned');
  const firstXpMs = signup && firstXp
    ? new Date(firstXp.occurredAt).getTime() - new Date(signup.occurredAt).getTime()
    : null;

  const uniqueActiveDays = new Set(events.map((event) => event.dateKey)).size;
  const loopClosureDays = new Set(
    events.filter((event) => event.type === 'daily_loop_closed').map((event) => event.dateKey),
  ).size;
  const meaningfulActionDays = new Set(
    events
      .filter((event) => ['daily_start_completed', 'quest_completed', 'all_daily_quests_completed', 'evening_shutdown_completed', 'weekly_review_completed'].includes(event.type))
      .map((event) => event.dateKey),
  ).size;

  return {
    totals: {
      events: events.length,
      uniqueActiveDays,
      loopClosureDays,
      meaningfulActionDays,
      loopClosureRate: meaningfulActionDays === 0 ? 0 : Math.round((loopClosureDays / meaningfulActionDays) * 100),
      firstXpMs,
    },
    byType,
    recentEvents: events.slice(0, 50),
  };
}
