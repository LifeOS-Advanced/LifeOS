import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Flame, Shield, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { UserProgress } from '@/lib/types';

interface TodayProgressCardProps {
  progress?: UserProgress;
  loading?: boolean;
}

export function TodayProgressCard({ progress, loading }: TodayProgressCardProps) {
  if (loading || !progress) {
    return (
      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="h-5 w-36 rounded bg-secondary animate-pulse" />
        <div className="mt-4 h-20 rounded-lg bg-secondary/70 animate-pulse" />
      </section>
    );
  }

  const levelSpan = Math.max(1, progress.xpForNextLevel - progress.xpForCurrentLevel);
  const xpPercent = Math.min(100, Math.round((progress.xpIntoLevel / levelSpan) * 100));
  const completedQuests = progress.quests.filter(quest => quest.completed).length;

  return (
    <section className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
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
            <Progress value={xpPercent} className="h-2 mt-3 max-w-xs" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {progress.quests.map(quest => (
            <motion.div
              key={quest.id}
              layout
              initial={false}
              animate={quest.completed ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center justify-between gap-3 rounded-lg surface-sunken px-3 py-2 ${quest.completed ? 'ring-1 ring-success/20' : ''}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${quest.completed ? 'text-success' : 'text-muted-foreground'}`} />
                <span className="text-xs font-medium text-foreground truncate">{quest.label}</span>
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">{Math.min(quest.current, quest.target)}/{quest.target}</span>
            </motion.div>
          ))}
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
        <span>{completedQuests}/{progress.quests.length} quests complete today · {progress.achievements.length} achievements unlocked</span>
        <span className="inline-flex items-center gap-1 text-primary font-medium">Progress <ChevronRight className="h-3.5 w-3.5" /></span>
      </Link>
    </section>
  );
}
