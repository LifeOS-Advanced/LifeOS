import { useState, useEffect, useCallback } from 'react';
import { getFocusSessions, setFocusSessions, getTasks } from '@/lib/store';
import { FocusSession } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Timer, Play, Pause, RotateCcw, Clock, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/app/EmptyState';

export default function Focus() {
  const tasks = getTasks();
  const [sessions, setLocalSessions] = useState(getFocusSessions());
  const [label, setLabel] = useState('Deep work');
  const [taskId, setTaskId] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [distractionNote, setDistractionNote] = useState('');

  const save = (updated: FocusSession[]) => { setLocalSessions(updated); setFocusSessions(updated); };

  const reset = useCallback(() => { setIsRunning(false); setTimeLeft(duration * 60); }, [duration]);

  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft <= 0) { completeSession(); return; }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft]);

  const completeSession = () => {
    setIsRunning(false);
    const session: FocusSession = { id: `f${Date.now()}`, label, duration, completedAt: new Date().toISOString().split('T')[0], distractionNotes: distractionNote || undefined, taskId };
    save([session, ...sessions]);
    setTimeLeft(duration * 60);
    setDistractionNote('');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / (duration * 60);
  const presets = [15, 25, 50, 90];

  const taskOf = (id?: string) => id ? tasks.find(t => t.id === id) : undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Focus</h1>
        <p className="text-muted-foreground text-sm">Deep work, attached to what matters.</p>
      </div>

      <motion.div
        className="rounded-2xl border border-border bg-card shadow-lg p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Input
          className="text-center text-lg font-semibold border-none bg-transparent mb-3 max-w-xs mx-auto"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Session label"
        />

        <div className="max-w-xs mx-auto mb-6 text-left">
          <Label className="text-xs text-muted-foreground">Focus on task (optional)</Label>
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

        <div className="relative w-52 h-52 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" strokeWidth="4" className="stroke-secondary" />
            <circle cx="50" cy="50" r="45" fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-primary" strokeDasharray={`${Math.PI * 90}`} strokeDashoffset={`${Math.PI * 90 * (1 - progress)}`} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted-foreground mt-1">{duration} min session</span>
          </div>
        </div>

        {!isRunning && (
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
          <Button onClick={() => setIsRunning(!isRunning)} className={`h-12 px-8 font-semibold ${isRunning ? 'bg-secondary text-foreground hover:bg-secondary/80' : 'gradient-primary text-primary-foreground shadow-glow hover:opacity-90'}`}>
            {isRunning ? <><Pause className="h-4 w-4 mr-2" />Pause</> : <><Play className="h-4 w-4 mr-2" />Start</>}
          </Button>
          <Button variant="outline" onClick={reset} className="h-12 px-6">
            <RotateCcw className="h-4 w-4 mr-2" />Reset
          </Button>
        </div>

        {isRunning && (
          <div className="mt-6 max-w-sm mx-auto">
            <Textarea
              placeholder="Distraction notes — jot down anything pulling your attention..."
              value={distractionNote}
              onChange={e => setDistractionNote(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
        )}
      </motion.div>

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
                    </div>
                  </div>
                  {session.distractionNotes && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{session.distractionNotes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
