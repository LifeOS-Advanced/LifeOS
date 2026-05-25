import { useMemo } from 'react';
import { useDailyStart, useEveningShutdown, useHabits, useProgress } from './queries';
import { buildDailyLoopHero, isNewUserSession } from './daily-loop';
import { buildNewUserHeroOverride } from './first-win';

const today = () => new Date().toISOString().split('T')[0];

export function useDailyLoopState() {
  const date = today();
  const { data: dailyStart, isLoading: startLoading } = useDailyStart(date);
  const { data: eveningShutdown, isLoading: shutdownLoading } = useEveningShutdown(date);
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: habits = [], isLoading: habitsLoading } = useHabits();

  const state = useMemo(() => {
    const dailyStartDone = Boolean(dailyStart?.confirmedAt || dailyStart?.mainPriority);
    const eveningShutdownDone = Boolean(eveningShutdown?.id);
    const quests = progress?.quests ?? [];
    let hero = buildDailyLoopHero({ dailyStartDone, eveningShutdownDone, quests });
    const completedQuests = quests.filter(q => q.completed).length;

    if (isNewUserSession()) {
      const override = buildNewUserHeroOverride({
        dailyStartDone,
        habits,
        quests,
        today: date,
      });
      if (override) {
        hero = {
          ...hero,
          phase: dailyStartDone ? 'next_quest' : 'start_day',
          title: override.ctaLabel,
          nextLine: override.nextLine,
          description: '',
          ctaLabel: override.ctaLabel,
          route: override.route,
        };
      }
    }

    return {
      date,
      dailyStartDone,
      eveningShutdownDone,
      quests,
      completedQuests,
      totalQuests: quests.length,
      hero,
      dailyLoopComplete: dailyStartDone && eveningShutdownDone,
    };
  }, [dailyStart, eveningShutdown, progress, habits, date]);

  return {
    ...state,
    progress,
    isLoading: startLoading || shutdownLoading || progressLoading || habitsLoading,
  };
}
