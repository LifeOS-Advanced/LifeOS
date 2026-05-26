import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, Moon, Sparkles, Trophy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  setDailyClosureHandler,
  setLevelUpHandler,
  type DailyClosureMoment,
  type LevelUpMoment,
} from '@/lib/reward-moments';

/** Global level-up dialog wired from emitRewardMoment. */
export function RewardMomentProvider() {
  const [moment, setMoment] = useState<LevelUpMoment | null>(null);
  const [closure, setClosure] = useState<DailyClosureMoment | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setLevelUpHandler(setMoment);
    setDailyClosureHandler(setClosure);
    return () => {
      setLevelUpHandler(null);
      setDailyClosureHandler(null);
    };
  }, []);

  return (
    <>
      <Dialog open={moment !== null} onOpenChange={(open) => !open && setMoment(null)}>
        <DialogContent className="overflow-hidden sm:max-w-sm text-center">
          <div className="pointer-events-none absolute inset-x-8 -top-24 h-40 rounded-full bg-primary/20 blur-3xl" />
          <DialogHeader className="items-center">
            <AnimatePresence mode="wait">
              {moment !== null && (
                <motion.div
                  key={moment.level}
                  initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
                  animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="relative mx-auto mb-3 flex h-24 w-24 items-center justify-center"
                >
                  <div className="absolute inset-0 rounded-full bg-primary/10 ring-1 ring-primary/20" />
                  <motion.div
                    className="absolute inset-2 rounded-full border border-primary/30"
                    animate={reduceMotion ? undefined : { rotate: 18 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <Sparkles className="absolute right-2 top-2 h-4 w-4 text-primary" />
                </motion.div>
              )}
            </AnimatePresence>
            <DialogTitle className="text-2xl">Level {moment?.level}</DialogTitle>
            <DialogDescription>
              Your saved work crossed the next threshold.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-secondary/70 p-3">
              <p className="text-lg font-semibold text-foreground tabular-nums">{moment?.totalXp ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">total XP</p>
            </div>
            <div className="rounded-lg bg-secondary/70 p-3">
              <p className="text-lg font-semibold text-primary tabular-nums">{moment?.xpToNextLevel ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">next level</p>
            </div>
          </div>
          <Button className="w-full gradient-primary text-primary-foreground" onClick={() => setMoment(null)}>
            Continue <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={closure !== null} onOpenChange={(open) => !open && setClosure(null)}>
        <DialogContent className="overflow-hidden sm:max-w-md text-center">
          <div className="pointer-events-none absolute inset-x-10 -top-28 h-44 rounded-full bg-accent/20 blur-3xl" />
          <DialogHeader className="items-center">
            <motion.div
              initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
              animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto mb-3 flex h-20 w-20 items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full bg-success/10 ring-1 ring-success/20" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent text-accent-foreground shadow-glow">
                <Moon className="h-7 w-7" />
              </div>
              <CheckCircle2 className="absolute right-1 top-1 h-4 w-4 text-success" />
            </motion.div>
            <DialogTitle className="text-2xl">Day closed</DialogTitle>
            <DialogDescription>
              The start-work-shutdown loop is complete for today.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 text-left">
            <div className="rounded-lg bg-secondary/70 p-3">
              <p className="text-lg font-semibold text-foreground tabular-nums">{closure?.questsDone ?? 0}/{closure?.questsTotal ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">quests</p>
            </div>
            <div className="rounded-lg bg-secondary/70 p-3">
              <p className="text-lg font-semibold text-warning tabular-nums">{closure?.streak ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">streak</p>
            </div>
            <div className="rounded-lg bg-secondary/70 p-3">
              <p className="text-lg font-semibold text-primary tabular-nums">{closure?.xpToday ?? 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">XP today</p>
            </div>
          </div>
          {closure?.tomorrowFirstTask?.trim() && (
            <p className="rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-foreground">
              Tomorrow first: <span className="font-medium">{closure.tomorrowFirstTask}</span>
            </p>
          )}
          <Button className="w-full gradient-primary text-primary-foreground" onClick={() => setClosure(null)}>
            Continue <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
