import { useState, useEffect, useCallback, useRef } from 'react';
import { FocusSession, UserProgress } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Timer, Play, Pause, RotateCcw, Clock, CheckSquare, Maximize2, Minimize2, AlertTriangle, TrendingUp, Target, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/app/EmptyState';
import { toast } from 'sonner';
import { useCreateFocusSession, useFocusSessions, useTasks } from '@/lib/queries';
import { emitRewardMoment } from '@/lib/reward-feedback';

export default function Focus() {
  const createSession = useCreateFocusSession();
  const { data: tasks = [] } = useTasks();
  const { data: sessions = [] } = useFocusSessions();
  const [label, setLabel] = useState('Deep work');
  const [sessionGoal, setSessionGoal] = useState('');
  const [taskId, setTaskId] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [distractionNote, setDistractionNote] = useState('');
  const [interruptions, setInterruptions] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDistractionPrompt, setShowDistractionPrompt] = useState(false);
  const [completionReward, setCompletionReward] = useState<UserProgress | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
    setInterruptions(0);
    setDistractionNote('');
  }, [duration]);

  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft <= 0) { void completeSession(); return; }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft]);

  // Fullscreen sync
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  const handlePause = () => {
    if (isRunning) {
      setIsRunning(false);
      setShowDistractionPrompt(true);
    } else {
      setIsRunning(true);
    }
  };

  const logInterruption = (note?: string) => {
    setInterruptions(i => i + 1);
    if (note) setDistractionNote(d => d ? `${d}\n• ${note}` : `• ${note}`);
    setShowDistractionPrompt(false);
  };

  const completeSession = async () => {
    setIsRunning(false);
    const completedAt = new Date().toISOString().split('T')[0];
    const linkedTask = taskOf(taskId);
    toast.success('Focus session complete', { description: `${duration}m of ${label}` });
    try {
      const { progress } = await createSession.mutateAsync({
        label,
        sessionGoal: sessionGoal || undefined,
        duration,
        completedAt,
        distractionNotes: distractionNote || undefined,
        interruptions: interruptions || undefined,
        taskId,
      });
      if (progress) {
        setCompletionReward(progress);
        emitRewardMoment(progress, { eventType: 'focus_completed' });
      }
    } catch {
      // Reward feedback is non-critical; the session may still be saved locally.
    }
    setTimeLeft(duration * 60);
    setDistractionNote('');
    setInterruptions(0);
    setSessionGoal('');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / (duration * 60);
  const presets = [15, 25, 50, 90];

  const taskOf = (id?: string) => id ? tasks.find(t => t.id === id) : undefined;

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const todaysSessions = sessions.filter(s => s.completedAt === today);
  const todayMinutes = todaysSessions.reduce((acc, s) => acc + s.duration, 0);
  const totalSessions = sessions.length;

  // Most focused goal/task
  const taskCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    if (s.taskId) acc[s.taskId] = (acc[s.taskId] || 0) + s.duration;
    return acc;
  }, {});
  const topTaskId = Object.entries(taskCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topTask = topTaskId ? tasks.find(t => t.id === topTaskId) : undefined;

  // Best time of day
  const hourCounts = sessions.reduce<Record<number, number>>((acc, s) => {
    const n = Number(s.id.replace('f', ''));
    if (!Number.isFinite(n)) return acc;
    const ts = new Date(n).getHours();
    acc[ts] = (acc[ts] || 0) + 1;
    return acc;
  }, {});
  const bestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestHourLabel = bestHour != null ? `${bestHour}:00` : '—';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Focus</h1>
        <p className="text-muted-foreground text-sm">Deep work, attached to what matters.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Clock} label="Focused today" value={`${todayMinutes}m`} hint={`${todaysSessions.length} sessions`} />
        <StatCard icon={Timer} label="All-time sessions" value={String(totalSessions)} />
        <StatCard icon={Target} label="Top task" value={topTask?.title ?? '—'} />
        <StatCard icon={TrendingUp} label="Best time of day" value={bestHourLabel} />
      </div>

      <div ref={containerRef} className={`rounded-2xl border border-border bg-card shadow-lg p-8 text-center ${isFullscreen ? 'fixed inset-0 z-50 rounded-none flex flex-col justify-center' : ''}`}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Input
            className="text-center text-lg font-semibold border-none bg-transparent mb-3 max-w-xs mx-auto"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Session label"
          />

          {!isFullscreen && (
            <div className="max-w-md mx-auto mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              <div>
                <Label className="text-xs text-muted-foreground">Session goal (what done looks like)</Label>
                <Input value={sessionGoal} onChange={e => setSessionGoal(e.target.value)} placeholder="e.g. Finish intro section" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Focus on task</Label>
                <Select value={taskId ?? 'none'} onValueChange={v => setTaskId(v === 'none' ? undefined : v)}>
                  <SelectTrigger><SelectValue placeholder="No task" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No task</SelectItem>
                    {tasks.filter(t => t.status !== 'done').map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {isFullscreen && sessionGoal && (
            <p className="text-base text-muted-foreground mb-4">🎯 {sessionGoal}</p>
          )}

          <div className={`relative mx-auto mb-8 ${isFullscreen ? 'w-80 h-80' : 'w-52 h-52'}`}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" strokeWidth="4" className="stroke-secondary" />
              <circle cx="50" cy="50" r="45" fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-primary" strokeDasharray={`${Math.PI * 90}`} strokeDashoffset={`${Math.PI * 90 * (1 - progress)}`} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-bold text-foreground tabular-nums ${isFullscreen ? 'text-7xl' : 'text-4xl'}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-xs text-muted-foreground mt-1">{duration} min session</span>
              {interruptions > 0 && (
                <span className="text-xs text-warning mt-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{interruptions} interruption{interruptions > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {!isRunning && !isFullscreen && (
            <div className="flex items-center justify-center gap-2 mb-6">
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => { setDuration(p); setTimeLeft(p * 60); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${duration === p ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  {p}m
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <Button onClick={handlePause} className={`h-12 px-8 font-semibold ${isRunning ? 'bg-secondary text-foreground hover:bg-secondary/80' : 'gradient-primary text-primary-foreground shadow-glow hover:opacity-90'}`}>
              {isRunning ? <><Pause className="h-4 w-4 mr-2" />Pause</> : <><Play className="h-4 w-4 mr-2" />Start</>}
            </Button>
            <Button variant="outline" onClick={reset} className="h-12 px-6">
              <RotateCcw className="h-4 w-4 mr-2" />Reset
            </Button>
            <Button variant="outline" onClick={toggleFullscreen} className="h-12 px-4" title="Fullscreen">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>

          {showDistractionPrompt && (
            <motion.div
              className="mt-6 max-w-md mx-auto rounded-lg border border-warning/40 bg-warning/5 p-4 text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-warning" />What distracted you?
              </p>
              <DistractionForm onLog={logInterruption} onSkip={() => setShowDistractionPrompt(false)} />
            </motion.div>
          )}

          {distractionNote && !showDistractionPrompt && !isFullscreen && (
            <div className="mt-6 max-w-sm mx-auto text-left">
              <Label className="text-xs text-muted-foreground">Distraction notes</Label>
              <Textarea value={distractionNote} onChange={e => setDistractionNote(e.target.value)} rows={2} className="text-sm" />
            </div>
          )}

          {completionReward?.awarded && completionReward.awarded.xp > 0 && !isFullscreen && (
            <motion.div
              className="mt-6 max-w-md mx-auto rounded-xl border border-primary/30 bg-primary/5 p-4 text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm font-semibold text-foreground">Sprint reward</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-secondary p-2">
                  <p className="text-lg font-semibold text-primary">+{completionReward.awarded.xp}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">XP</p>
                </div>
                <div className="rounded-lg bg-secondary p-2">
                  <p className="text-lg font-semibold text-foreground">{completionReward.level}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Level</p>
                </div>
                <div className="rounded-lg bg-secondary p-2">
                  <p className="text-lg font-semibold text-warning">{completionReward.dailyStreak}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Streak</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Next move: finish one daily quest or attach another sprint to a goal.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {!isFullscreen && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Clock className="h-4 w-4" />Recent Sessions</h2>
          {sessions.length === 0 ? (
            <EmptyState
              icon={Timer}
              title="No focus sessions yet"
              description="Pick a task, hit start, and let the timer hold you accountable."
              tip="25-minute sessions are a great default — try one now."
            />
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 10).map(session => {
                const linked = taskOf(session.taskId);
                return (
                  <div key={session.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-3 shadow-card">
                    <div className="h-8 w-8 rounded-lg gradient-accent flex items-center justify-center text-accent-foreground shrink-0">
                      <Timer className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{session.label}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-muted-foreground">{session.completedAt} · {session.duration}min</p>
                        {linked && (
                          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            <CheckSquare className="h-3 w-3" />{linked.title}
                          </span>
                        )}
                        {session.sessionGoal && (
                          <span className="inline-flex items-center gap-1 text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                            <Target className="h-3 w-3" />{session.sessionGoal}
                          </span>
                        )}
                        {!!session.interruptions && (
                          <span className="inline-flex items-center gap-1 text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" />{session.interruptions}
                          </span>
                        )}
                      </div>
                    </div>
                    {session.distractionNotes && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{session.distractionNotes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DistractionForm({ onLog, onSkip }: { onLog: (n?: string) => void; onSkip: () => void }) {
  const [val, setVal] = useState('');
  return (
    <div className="space-y-2">
      <Input value={val} onChange={e => setVal(e.target.value)} placeholder="Slack ping, random thought..." className="text-sm" autoFocus />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { onLog(val); }} className="gradient-primary text-primary-foreground">Log & resume</Button>
        <Button size="sm" variant="outline" onClick={onSkip}>Skip</Button>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
        <Icon className="h-3 w-3" />{label}
      </div>
      <div className="text-lg font-bold text-foreground truncate">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}
