import { useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import { useDailyLoopState } from '@/lib/useDailyLoopState';

interface LocalReminderProviderProps {
  profile?: UserProfile | null;
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function msUntil(time: string) {
  const [hoursRaw, minutesRaw] = time.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  const delta = target.getTime() - Date.now();
  return delta > 0 ? delta : null;
}

function notifyOnce(kind: string, title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const key = `lifeos_notification_${kind}_${todayKey()}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  new Notification(title, { body, icon: '/pwa-icon.svg' });
}

export function LocalReminderProvider({ profile }: LocalReminderProviderProps) {
  const { dailyStartDone, eveningShutdownDone, progress } = useDailyLoopState();
  const notifications = profile?.preferences?.notifications;
  const enabled = Boolean(
    notifications?.browserEnabled &&
    'Notification' in window &&
    Notification.permission === 'granted',
  );

  useEffect(() => {
    if (!enabled) return;
    const timers: number[] = [];

    if (notifications?.dailyReminders && !dailyStartDone) {
      const delay = msUntil(notifications.morningReminderTime ?? '08:30');
      if (delay != null) {
        timers.push(window.setTimeout(() => {
          notifyOnce('daily_start', 'Plan your day', 'Daily Start takes under two minutes.');
        }, delay));
      }
    }

    if (notifications?.dailyReminders && !eveningShutdownDone) {
      const delay = msUntil(notifications.eveningReminderTime ?? '20:30');
      if (delay != null) {
        timers.push(window.setTimeout(() => {
          notifyOnce('evening_shutdown', 'Close the day', 'Review what moved and choose tomorrow’s first task.');
        }, delay));
      }
    }

    if (notifications?.habitStreakAlerts && progress?.dailyStreak && progress.dailyStreak > 0 && !progress.recentEvents.some(e => e.date === todayKey())) {
      const delay = msUntil('18:00');
      if (delay != null) {
        timers.push(window.setTimeout(() => {
          notifyOnce('streak_at_risk', 'One action keeps momentum alive', 'Open LifeOS and finish the easiest quest for today.');
        }, delay));
      }
    }

    if (notifications?.weeklyReviewReminder) {
      const now = new Date();
      const isSunday = now.getDay() === 0;
      const delay = isSunday ? msUntil('17:00') : null;
      if (delay != null) {
        timers.push(window.setTimeout(() => {
          notifyOnce('weekly_review', 'Weekly Reset', 'Close the week and earn a streak freeze.');
        }, delay));
      }
    }

    return () => timers.forEach(window.clearTimeout);
  }, [
    dailyStartDone,
    enabled,
    eveningShutdownDone,
    notifications?.browserEnabled,
    notifications?.dailyReminders,
    notifications?.eveningReminderTime,
    notifications?.habitStreakAlerts,
    notifications?.morningReminderTime,
    notifications?.weeklyReviewReminder,
    progress?.dailyStreak,
    progress?.recentEvents,
  ]);

  return null;
}
