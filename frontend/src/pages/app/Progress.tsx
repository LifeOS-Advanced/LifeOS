import { Award, CheckCircle2, Flame, History, Shield, Trophy, type LucideIcon } from 'lucide-react';
import { TodayProgressCard } from '@/components/app/TodayProgressCard';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { useProgress } from '@/lib/queries';

export default function ProgressPage() {
  const { data: progress, isLoading } = useProgress();
  const unlocked = progress?.achievements ?? [];
  const events = progress?.recentEvents ?? [];
  const questDone = progress?.quests.filter(quest => quest.completed).length ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-eyebrow">Productivity loop</p>
        <h1 className="text-2xl font-bold text-foreground">Progress</h1>
        <p className="text-muted-foreground text-sm">XP, streaks, quests, and milestones earned from real work.</p>
      </div>

      <TodayProgressCard progress={progress} loading={isLoading} />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Trophy} label="Total XP" value={String(progress?.totalXp ?? 0)} />
        <Stat icon={Flame} label="Daily streak" value={`${progress?.dailyStreak ?? 0}d`} />
        <Stat icon={Shield} label="Streak freezes" value={String(progress?.streakFreezes ?? 0)} />
        <Stat icon={CheckCircle2} label="Quests today" value={`${questDone}/${progress?.quests.length ?? 5}`} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="px-5 py-4 border-b border-subtle flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h2 className="text-h3 text-foreground">Achievements</h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlocked.length === 0 ? (
              <p className="text-sm text-muted-foreground sm:col-span-2">No achievements yet. Finish a focus sprint or weekly review to unlock the first one.</p>
            ) : unlocked.map(achievement => (
              <div key={achievement.id} className="rounded-lg surface-sunken p-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-warning" />
                  <h3 className="text-sm font-semibold text-foreground">{achievement.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-3">
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card">
          <div className="px-5 py-4 border-b border-subtle flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h2 className="text-h3 text-foreground">Recent Wins</h2>
          </div>
          <div className="p-4 space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Complete a task, habit, or focus session to start your win history.</p>
            ) : events.map(event => (
              <div key={event.key} className="flex items-center justify-between gap-3 rounded-lg surface-sunken px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{event.description || event.date}</p>
                </div>
                <span className="text-xs font-semibold text-primary shrink-0">+{event.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card shadow-card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-h3 text-foreground">Daily Quest Board</h2>
          <span className="text-xs text-muted-foreground">{questDone} complete</span>
        </div>
        <div className="space-y-3">
          {(progress?.quests ?? []).map(quest => (
            <div key={quest.id}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-foreground">{quest.label}</span>
                <span className="text-muted-foreground tabular-nums">{Math.min(quest.current, quest.target)}/{quest.target}</span>
              </div>
              <ProgressBar value={Math.min(100, Math.round((quest.current / quest.target) * 100))} className="h-2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <div className="text-xl font-semibold text-foreground tabular-nums">{value}</div>
    </div>
  );
}
