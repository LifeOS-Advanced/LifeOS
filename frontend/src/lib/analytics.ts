import { api, getToken } from './api';
import type { AnalyticsEventInput, AnalyticsEventType } from './types';

const SESSION_KEY = 'lifeos_loop_session_id';
const LOCAL_EVENTS_KEY = 'lifeos_local_analytics_events';

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function dateKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function storeLocalEvent(event: AnalyticsEventInput) {
  try {
    const raw = localStorage.getItem(LOCAL_EVENTS_KEY);
    const events = raw ? JSON.parse(raw) as AnalyticsEventInput[] : [];
    events.unshift(event);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events.slice(0, 250)));
  } catch {
    // Analytics is deliberately best-effort.
  }
}

export function trackLoopEvent(type: AnalyticsEventType, metadata?: Record<string, unknown>) {
  const event: AnalyticsEventInput = {
    type,
    occurredAt: new Date().toISOString(),
    dateKey: dateKey(),
    sessionId: getSessionId(),
    source: 'frontend',
    metadata,
  };

  if (!getToken()) {
    storeLocalEvent(event);
    return;
  }

  void api.post('/api/analytics/event', event).catch(() => {
    storeLocalEvent(event);
  });
}

export function trackLoopEventOnce(
  key: string,
  type: AnalyticsEventType,
  metadata?: Record<string, unknown>,
) {
  const storageKey = `lifeos_analytics_once_${key}`;
  if (localStorage.getItem(storageKey)) return;
  localStorage.setItem(storageKey, new Date().toISOString());
  trackLoopEvent(type, metadata);
}
