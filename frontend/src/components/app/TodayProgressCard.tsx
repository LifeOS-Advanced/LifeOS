import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Flame, Info, Shield, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getNextQuestActionPreview, questEstimate, questMeta, questRoute } from '@/lib/daily-loop';
import type { UserProgress } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TodayProgressCardProps {
  progress?: UserProgress;
  loading?: boolean;
}

export function TodayProgressCard({ progress, loading }: TodayProgressCardProps) {
  const reduceMotion = useReducedMotion();
  const levelSpan = progress ? Math.max(1, progress.xpForNextLevel - progress.xpForCurrentLevel) : 1;
  const xpPercent = progress ? Math.min(100, Math.round((progress.xpIntoLevel / levelSpan) * 100)) : 0;
  const completedQuests = progress?.quests.filter(quest => quest.completed).length ?? 0;
  const totalQuests = progress?.quests.length ?? 0;
  const allQuestsComplete = totalQuests > 0 && completedQuests === totalQuests;
  const oneQuestLeft = totalQuests > 0 && totalQuests - completedQuests === 1;
  const nextAction = progress ? getNextQuestActionPreview(progress.quests) : undefined;
  const previousXpPercent = useRef<number | null>(null);
  const previousCompletedQuests = useRef<number | null>(null);
  const [xpFlash, setXpFlash] = useState(false);
  const [questPulseKey, setQuestPulseKey] = useState(0);

  useEffect(() => {
    if (previousXpPercent.current !== null && xpPercent > previousXpPercent.current) {
      setXpFlash(true);
      const timeout = window.setTimeout(() => setXpFlash(false), 900);
      previousXpPercent.current = xpPercent;
      return () => window.clearTimeout(timeout);
    }
    previousXpPercent.current = xpPercent;
    return undefined;
  }, [xpPercent]);

  useEffect(() => {
    if (
      previousCompletedQuests.current !== null &&
      completedQuests > previousCompletedQuests.current
    ) {
      setQuestPulseKey(key => key + 1);
    }
    previousCompletedQuests.current = completedQuests;
  }, [completedQuests]);

  if (loading || !progress) {
    return (
      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="h-5 w-36 rounded bg-secondary animate-pulse" />
        <div className="mt-4 h-20 rounded-lg bg-secondary/70 animate-pulse" />
      </section>
    );
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card shadow-card',
        oneQuestLeft && 'reward-surface-near',
        allQuestsComplete && 'reward-surface-complete',
      )}
    >
      <div className="p-5 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_auto] gap-5 lg:items-center">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-lg gradient-primary text-primary-foreground flex items-center justify-center shadow-glow">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-h3 text-foreground">Today Progress</h2>
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Level {progress.level}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progress.xpToNextLevel} XP to level {progress.level + 1}
            </p>
            <div className={cn('relative mt-3 max-w-xs', xpFlash && 'progress-flash')}>
              <Progress value={xpPercent} className="reward-progress h-2" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {progress.quests.map((quest, index) => {
            const meta = questMeta(quest);
            const almostDone = !quest.completed && quest.current >= Math.max(1, quest.target - 1);
            return (
              <Tooltip key={quest.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    layout
                    initial={false}
                    animate={
                      !reduceMotion && quest.completed
                        ? { scale: [1, 1.018, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={questRoute(quest)}
                      className={cn(
                        'group relative flex items-center justify-between gap-3 overflow-hidden rounded-lg surface-sunken px-3 py-2 transition-colors hover:bg-secondary/70 hover:ring-1 hover:ring-primary/20',
                        quest.completed && 'reward-quest-complete ring-1 ring-success/25',
                        almostDone && 'reward-quest-almost ring-1 ring-primary/20 bg-primary/5',
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          key={`${quest.id}-${quest.completed ? questPulseKey : index}`}
                          className={cn(
                            'relative shrink-0',
                            quest.completed && !reduceMotion && 'check-pop',
                          )}
                        >
                          <CheckCircle2
                            className={cn(
                              'h-4 w-4',
                              quest.completed
                                ? 'text-success'
                                : almostDone
                                  ? 'text-primary'
                                  : 'text-muted-foreground',
                            )}
                          />
                          {quest.completed && !reduceMotion && <span className="reward-mini-ring" />}
                        </span>
                        <div className="min-w-0">
                          <span className="block text-xs font-medium text-foreground truncate">{meta.action}</span>
                          <span className="block text-[10px] text-muted-foreground truncate">
                            {quest.completed
                              ? 'Done'
                              : almostDone
                                ? `Almost done - +${meta.xp} XP`
                                : `+${meta.xp} XP - ${questEstimate(quest)}`}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
                        {Math.min(quest.current, quest.target)}/{quest.target}
                        <Info className="h-3 w-3" />
                      </span>
                    </Link>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-56 text-xs">
                  {meta.tooltip}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <div className="flex lg:flex-col gap-2 justify-between">
          <div className="rounded-lg bg-secondary/70 px-3 py-2 min-w-24">
            <div className="flex items-center gap-1.5 text-warning">
              <Flame className="h-4 w-4" />
              <span className="text-lg font-semibold tabular-nums">{progress.dailyStreak}</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">day streak</p>
          </div>
          <div className="rounded-lg bg-secondary/70 px-3 py-2 min-w-24">
            <div className="flex items-center gap-1.5 text-primary">
              <Shield className="h-4 w-4" />
              <span className="text-lg font-semibold tabular-nums">{progress.streakFreezes}</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">freezes</p>
          </div>
        </div>
      </div>

      <Link to="/app/progress" className="flex items-center justify-between gap-3 border-t border-subtle bg-secondary/35 px-5 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <span>
          {allQuestsComplete
            ? `${completedQuests}/${progress.quests.length} quests complete today - loop closed`
            : nextAction
              ? `Next: ${nextAction.label} - ${nextAction.xp ? `+${nextAction.xp} XP - ` : ''}${nextAction.estimate}`
              : `${completedQuests}/${progress.quests.length} quests complete today - ${progress.achievements.length} achievements unlocked`}
          {oneQuestLeft && !allQuestsComplete && ' - one quest left'}
        </span>
        <span className="inline-flex items-center gap-1 text-primary font-medium">Progress <ChevronRight className="h-3.5 w-3.5" /></span>
      </Link>
    </section>
  );
}
