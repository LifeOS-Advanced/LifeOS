import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  Check,
  Clock,
  Flame,
  MapPin,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DisciplineTarget,
  ReplacementActionCategory,
  UrgeLog,
  UrgeOutcome,
} from '@/lib/types';
import {
  useCreateDisciplineTarget,
  useCreateReplacementAction,
  useCreateUrgeLog,
  useDisciplineInsights,
  useDisciplineTargets,
  useProfile,
  useReplacementActions,
  useUpdateDisciplineTarget,
  useUpdateUrgeLog,
  useUrgeLogs,
} from '@/lib/queries';
import { emitRewardMoment } from '@/lib/reward-feedback';

const tabs = [
  { route: '/app/discipline', label: 'Overview', icon: ShieldCheck },
  { route: '/app/discipline/urge', label: 'Urge', icon: Flame },
  { route: '/app/discipline/triggers', label: 'Triggers', icon: Brain },
  { route: '/app/discipline/replacements', label: 'Replacements', icon: RotateCcw },
  { route: '/app/discipline/reviews', label: 'Reviews', icon: Sparkles },
];

const defaultReplacementIdeas = [
  { title: 'Two-minute walk', category: 'body' as const, durationMinutes: 2 },
  { title: 'Cold water reset', category: 'environment' as const, durationMinutes: 2 },
  { title: 'Box breathing', category: 'breathing' as const, durationMinutes: 3 },
  { title: 'Write one honest sentence', category: 'reflection' as const, durationMinutes: 2 },
];

const categoryLabels: Record<ReplacementActionCategory, string> = {
  body: 'Body',
  breathing: 'Breathing',
  environment: 'Environment',
  reflection: 'Reflection',
  focus: 'Focus',
  social: 'Social',
  custom: 'Custom',
};

export default function Discipline() {
  const location = useLocation();
  const view = location.pathname.endsWith('/urge')
    ? 'urge'
    : location.pathname.endsWith('/triggers')
      ? 'triggers'
      : location.pathname.endsWith('/replacements')
        ? 'replacements'
        : location.pathname.endsWith('/reviews')
          ? 'reviews'
          : 'overview';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-eyebrow">Behavior change</p>
          <h1 className="text-2xl font-bold text-foreground">Discipline Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interrupt urges, map triggers, and turn setbacks into usable data.
          </p>
        </div>
        <Button asChild className="gradient-primary text-primary-foreground shadow-glow">
          <Link to="/app/discipline/urge"><Flame className="h-4 w-4 mr-2" />I have an urge</Link>
        </Button>
      </header>

      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {tabs.map(tab => {
          const active = view === 'overview' ? tab.route === '/app/discipline' : location.pathname === tab.route;
          return (
            <Link
              key={tab.route}
              to={tab.route}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                active
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {view === 'overview' && <DisciplineOverview />}
      {view === 'urge' && <UrgeFlow />}
      {view === 'triggers' && <TriggerMap />}
      {view === 'replacements' && <ReplacementLibrary />}
      {view === 'reviews' && <RelapseReviews />}
    </div>
  );
}

function DisciplineOverview() {
  const { data: targets = [] } = useDisciplineTargets();
  const { data: replacements = [] } = useReplacementActions();
  const { data: urges = [] } = useUrgeLogs();
  const { data: insights } = useDisciplineInsights();
  const createTarget = useCreateDisciplineTarget();
  const updateTarget = useUpdateDisciplineTarget();
  const [targetForm, setTargetForm] = useState({ name: '', identityStatement: '' });

  const activeTargets = targets.filter(target => target.status === 'active');
  const recent = urges.slice(0, 4);
  const interruptionRate = insights?.totalUrges
    ? Math.round(((insights.interruptedCount + insights.delayedCount) / insights.totalUrges) * 100)
    : 0;

  const addTarget = async () => {
    if (!targetForm.name.trim()) return toast.error('Name the behavior you want to change');
    try {
      await createTarget.mutateAsync({
        name: targetForm.name.trim(),
        identityStatement: targetForm.identityStatement.trim() || undefined,
        status: 'active',
      });
      setTargetForm({ name: '', identityStatement: '' });
      toast.success('Discipline target added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add target');
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Flame} label="Urges logged" value={insights?.totalUrges ?? 0} hint="Last 30 days" />
        <MetricCard icon={ShieldCheck} label="Interrupted" value={insights?.interruptedCount ?? 0} hint={`${interruptionRate}% protected or delayed`} />
        <MetricCard icon={RotateCcw} label="Replacements" value={replacements.length} hint="Actions ready" />
        <MetricCard icon={Target} label="Active targets" value={activeTargets.length} hint="Behaviors in focus" />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-h3 text-foreground">Current discipline targets</h2>
              <p className="text-xs text-muted-foreground">Name the pattern, then interrupt it while it is still small.</p>
            </div>
            <Button asChild size="sm" variant="outline"><Link to="/app/discipline/urge">Log urge</Link></Button>
          </div>
          <div className="grid gap-3">
            {targets.length === 0 ? (
              <EmptyDisciplineState />
            ) : targets.map(target => (
              <div key={target.id} className="rounded-lg border border-subtle bg-background/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{target.name}</h3>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{target.status}</span>
                    </div>
                    {target.identityStatement && <p className="text-xs text-muted-foreground mt-1">{target.identityStatement}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateTarget.mutate({ id: target.id, updates: { status: target.status === 'active' ? 'paused' : 'active' } })}
                  >
                    {target.status === 'active' ? 'Pause' : 'Resume'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-h3 text-foreground mb-3">Add target</h2>
          <div className="space-y-3">
            <div>
              <Label>Behavior</Label>
              <Input value={targetForm.name} onChange={e => setTargetForm({ ...targetForm, name: e.target.value })} placeholder="e.g. Late-night scrolling" />
            </div>
            <div>
              <Label>Identity anchor</Label>
              <Textarea
                value={targetForm.identityStatement}
                onChange={e => setTargetForm({ ...targetForm, identityStatement: e.target.value })}
                placeholder="e.g. I protect my sleep after 10 PM."
                rows={3}
              />
            </div>
            <Button onClick={addTarget} disabled={createTarget.isPending} className="w-full">
              <Plus className="h-4 w-4 mr-2" />Add target
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-h3 text-foreground">Recent discipline signals</h2>
            <p className="text-xs text-muted-foreground">Neutral records of what happened.</p>
          </div>
          <Link to="/app/discipline/triggers" className="text-xs font-medium text-primary hover:underline">Open trigger map</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No urges logged yet. The fastest path is one honest entry when an urge appears.</p>
        ) : (
          <div className="grid gap-2">
            {recent.map(urge => (
              <UrgeRow key={urge.id} urge={urge} target={targets.find(target => target.id === urge.targetId)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function UrgeFlow() {
  const navigate = useNavigate();
  const { data: targets = [] } = useDisciplineTargets();
  const { data: replacements = [] } = useReplacementActions();
  const { data: profile } = useProfile();
  const createTarget = useCreateDisciplineTarget();
  const createReplacement = useCreateReplacementAction();
  const createUrge = useCreateUrgeLog();
  const [newTargetName, setNewTargetName] = useState('');
  const [form, setForm] = useState({
    targetId: targets[0]?.id ?? '',
    replacementActionId: '',
    intensity: 6,
    trigger: '',
    emotion: '',
    context: '',
    location: '',
    outcome: 'interrupted' as UrgeOutcome,
    replacementCompleted: true,
    notes: '',
  });

  const effectiveTargetId = form.targetId || targets[0]?.id || '';
  const targetSpecific = replacements.filter(action => !effectiveTargetId || !action.targetId || action.targetId === effectiveTargetId);
  const suggested = targetSpecific[0] ?? replacements[0];
  const suggestedIdea = defaultReplacementIdeas[0];

  const submit = async () => {
    if (!effectiveTargetId && !newTargetName.trim()) return toast.error('Choose or name the target behavior');
    if (!form.trigger.trim()) return toast.error('Add the trigger');
    if (!form.emotion.trim()) return toast.error('Add the emotion');

    try {
      let targetId = effectiveTargetId || undefined;
      if (!targetId && newTargetName.trim()) {
        const target = await createTarget.mutateAsync({ name: newTargetName.trim(), status: 'active' });
        targetId = target.id;
      }

      let replacementActionId = form.replacementActionId || suggested?.id;
      if (!replacementActionId && form.replacementCompleted) {
        const created = await createReplacement.mutateAsync({
          title: suggestedIdea.title,
          category: suggestedIdea.category,
          durationMinutes: suggestedIdea.durationMinutes,
          isDefault: true,
          targetId,
        });
        replacementActionId = created.id;
      }

      const { progress, urge } = await createUrge.mutateAsync({
        targetId,
        replacementActionId,
        intensity: form.intensity,
        trigger: form.trigger.trim(),
        emotion: form.emotion.trim(),
        context: form.context.trim() || undefined,
        location: form.location.trim() || undefined,
        outcome: form.outcome,
        replacementCompleted: form.replacementCompleted,
        notes: form.notes.trim() || undefined,
        occurredAt: new Date().toISOString(),
      });

      if (progress) {
        emitRewardMoment(progress, {
          eventType: form.outcome === 'interrupted' ? 'urge_interrupted' : form.replacementCompleted ? 'replacement_completed' : 'discipline_routine_completed',
          profile,
          evidenceLabel: form.outcome === 'interrupted' ? 'Urge interrupted' : 'Discipline entry saved',
          intensity: form.outcome === 'relapsed' ? 'low' : 'medium',
          variant: 'xp',
        });
      }
      toast.success(form.outcome === 'relapsed' ? 'Urge recorded for review' : 'Urge recorded');
      if (urge.outcome === 'relapsed') navigate('/app/discipline/reviews');
      else navigate('/app/discipline');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save urge');
    }
  };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-h3 text-foreground">I have an urge</h2>
          <p className="text-xs text-muted-foreground">Log the signal quickly, choose the next action, then move.</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Under 10 seconds</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Target behavior</Label>
              <Select value={effectiveTargetId || 'new'} onValueChange={value => setForm({ ...form, targetId: value === 'new' ? '' : value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New target</SelectItem>
                  {targets.map(target => <SelectItem key={target.id} value={target.id}>{target.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!effectiveTargetId && (
              <div>
                <Label>New target name</Label>
                <Input value={newTargetName} onChange={e => setNewTargetName(e.target.value)} placeholder="e.g. Doomscrolling" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Intensity</Label>
              <span className="text-sm font-semibold text-primary">{form.intensity}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={form.intensity}
              onChange={e => setForm({ ...form, intensity: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Trigger</Label>
              <Input value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} placeholder="stress, boredom, late night" />
            </div>
            <div>
              <Label>Emotion</Label>
              <Input value={form.emotion} onChange={e => setForm({ ...form, emotion: e.target.value })} placeholder="anxious, tired, lonely" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Context</Label>
              <Input value={form.context} onChange={e => setForm({ ...form, context: e.target.value })} placeholder="alone, after work, phone nearby" />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="bedroom, desk, commute" />
            </div>
          </div>

          <div>
            <Label>Replacement action</Label>
            <Select value={form.replacementActionId || 'suggested'} onValueChange={value => setForm({ ...form, replacementActionId: value === 'suggested' ? '' : value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="suggested">{suggested ? `${suggested.title} (${suggested.durationMinutes}m)` : `${suggestedIdea.title} (${suggestedIdea.durationMinutes}m)`}</SelectItem>
                {replacements.map(action => <SelectItem key={action.id} value={action.id}>{action.title} ({action.durationMinutes}m)</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Result</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(['interrupted', 'delayed', 'relapsed'] as UrgeOutcome[]).map(outcome => (
                <OutcomeButton key={outcome} active={form.outcome === outcome} outcome={outcome} onClick={() => setForm({ ...form, outcome })} />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-subtle bg-background/50 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.replacementCompleted}
              onChange={e => setForm({ ...form, replacementCompleted: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            Replacement action completed or started
          </label>

          <div>
            <Label>Note (optional)</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="One sentence is enough." />
          </div>

          <Button onClick={submit} disabled={createUrge.isPending} className="w-full gradient-primary text-primary-foreground">
            Save interruption <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <aside className="rounded-xl border border-primary/20 bg-primary/5 p-4 h-fit">
          <div className="h-10 w-10 rounded-lg gradient-primary text-primary-foreground flex items-center justify-center mb-3">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">Next action</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {suggested ? `${suggested.title} for ${suggested.durationMinutes} minutes.` : `${suggestedIdea.title} for ${suggestedIdea.durationMinutes} minutes.`}
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            The goal is interruption first. Reflection can happen later if needed.
          </p>
        </aside>
      </div>
    </motion.section>
  );
}

function TriggerMap() {
  const { data: insights, isLoading } = useDisciplineInsights();
  const strongest = insights?.topTriggers[0];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Activity} label="Average intensity" value={insights?.averageIntensity ?? 0} hint="Last 30 days" />
        <MetricCard icon={ShieldCheck} label="Interrupted" value={insights?.interruptedCount ?? 0} />
        <MetricCard icon={AlertTriangle} label="Relapses" value={insights?.relapseCount ?? 0} />
        <MetricCard icon={Clock} label="High-risk hour" value={formatHour(insights?.highRiskHours[0]?.hour)} />
      </div>
      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-h3 text-foreground">Trigger map</h2>
            <p className="text-xs text-muted-foreground">
              {strongest ? `Strongest signal: ${strongest.label} appeared ${strongest.count} time${strongest.count === 1 ? '' : 's'}.` : 'Patterns appear after a few logged urges.'}
            </p>
          </div>
          <Button asChild size="sm" variant="outline"><Link to="/app/discipline/urge">Log urge</Link></Button>
        </div>
        {isLoading ? (
          <div className="h-40 rounded-lg bg-secondary animate-pulse" />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <InsightList title="Triggers" items={insights?.topTriggers ?? []} />
            <InsightList title="Emotions" items={insights?.topEmotions ?? []} />
            <InsightList title="Contexts" items={insights?.topContexts ?? []} />
            <div className="rounded-lg border border-subtle bg-background/40 p-4">
              <h3 className="font-semibold text-foreground mb-3">High-risk times</h3>
              {(insights?.highRiskHours.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No time pattern yet.</p>
              ) : insights!.highRiskHours.map(item => (
                <div key={item.hour} className="flex items-center justify-between border-b border-subtle py-2 last:border-0">
                  <span className="text-sm text-foreground">{formatHour(item.hour)}</span>
                  <span className="text-xs text-muted-foreground">{item.count} log{item.count === 1 ? '' : 's'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ReplacementLibrary() {
  const { data: targets = [] } = useDisciplineTargets();
  const { data: replacements = [] } = useReplacementActions();
  const createReplacement = useCreateReplacementAction();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'body' as ReplacementActionCategory,
    durationMinutes: 2,
    targetId: '',
  });

  const addReplacement = async () => {
    if (!form.title.trim()) return toast.error('Give the replacement action a title');
    try {
      await createReplacement.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        durationMinutes: form.durationMinutes,
        targetId: form.targetId || undefined,
        isDefault: false,
      });
      setForm({ title: '', description: '', category: 'body', durationMinutes: 2, targetId: '' });
      toast.success('Replacement action added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save replacement action');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <section className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-h3 text-foreground mb-1">Replacement library</h2>
        <p className="text-xs text-muted-foreground mb-4">A replacement should be small enough to start while the urge is still present.</p>
        {replacements.length === 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {defaultReplacementIdeas.map(idea => (
              <div key={idea.title} className="rounded-lg border border-dashed border-border bg-background/40 p-4">
                <p className="font-medium text-foreground">{idea.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{categoryLabels[idea.category]} · {idea.durationMinutes} min</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {replacements.map(action => (
              <div key={action.id} className="rounded-lg border border-subtle bg-background/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{categoryLabels[action.category]} · {action.durationMinutes} min</p>
                  </div>
                  {action.targetId && <Target className="h-4 w-4 text-primary" />}
                </div>
                {action.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{action.description}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-h3 text-foreground mb-3">Add replacement</h2>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. 10 push-ups" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={value => setForm({ ...form, category: value as ReplacementActionCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryLabels) as ReplacementActionCategory[]).map(category => <SelectItem key={category} value={category}>{categoryLabels[category]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Minutes</Label>
              <Input type="number" min={1} max={120} value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Math.max(1, Number(e.target.value) || 2) })} />
            </div>
          </div>
          <div>
            <Label>Target</Label>
            <Select value={form.targetId || 'any'} onValueChange={value => setForm({ ...form, targetId: value === 'any' ? '' : value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any target</SelectItem>
                {targets.map(target => <SelectItem key={target.id} value={target.id}>{target.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What exactly should happen?" />
          </div>
          <Button onClick={addReplacement} disabled={createReplacement.isPending} className="w-full">
            <Plus className="h-4 w-4 mr-2" />Add action
          </Button>
        </div>
      </section>
    </div>
  );
}

function RelapseReviews() {
  const { data: urges = [] } = useUrgeLogs();
  const { data: replacements = [] } = useReplacementActions();
  const { data: profile } = useProfile();
  const updateUrge = useUpdateUrgeLog();
  const candidates = urges.filter(urge => urge.outcome === 'relapsed');
  const firstUnreviewed = candidates.find(urge => !urge.review?.reviewedAt);
  const [selectedId, setSelectedId] = useState(firstUnreviewed?.id ?? candidates[0]?.id ?? '');
  const selected = candidates.find(urge => urge.id === selectedId);
  const [form, setForm] = useState({
    whatHappened: '',
    whatTriggered: '',
    nextChange: '',
    nextReplacementActionId: '',
  });

  useEffect(() => {
    if (!selectedId && candidates[0]?.id) setSelectedId(candidates[0].id);
  }, [candidates, selectedId]);

  const saveReview = async () => {
    if (!selected) return;
    if (!form.whatHappened.trim() || !form.nextChange.trim()) {
      return toast.error('Add what happened and one next change');
    }
    try {
      const { progress } = await updateUrge.mutateAsync({
        id: selected.id,
        updates: {
          review: {
            whatHappened: form.whatHappened.trim(),
            whatTriggered: form.whatTriggered.trim() || undefined,
            nextChange: form.nextChange.trim(),
            nextReplacementActionId: form.nextReplacementActionId || undefined,
          },
        },
      });
      if (progress) {
        emitRewardMoment(progress, {
          eventType: 'relapse_reviewed',
          profile,
          evidenceLabel: 'Relapse reviewed',
          intensity: 'medium',
          variant: 'xp',
        });
      }
      setForm({ whatHappened: '', whatTriggered: '', nextChange: '', nextReplacementActionId: '' });
      toast.success('Review saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save review');
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-h3 text-foreground">Relapse review</h2>
          <p className="text-xs text-muted-foreground">A relapse is information. Capture one adjustment for next time.</p>
        </div>
        <Button asChild size="sm" variant="outline"><Link to="/app/discipline/urge">Log new urge</Link></Button>
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-background/40 py-10 text-center">
          <ShieldCheck className="h-8 w-8 mx-auto text-primary mb-2" />
          <p className="font-medium text-foreground">No relapse reviews waiting.</p>
          <p className="text-sm text-muted-foreground mt-1">If a setback happens, this is where it becomes data.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="space-y-2">
            {candidates.map(urge => (
              <button
                key={urge.id}
                onClick={() => setSelectedId(urge.id)}
                className={`w-full rounded-lg border px-3 py-3 text-left transition-all ${
                  selectedId === urge.id ? 'border-primary/40 bg-primary/10' : 'border-subtle bg-background/40 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{urge.trigger}</span>
                  {urge.review?.reviewedAt ? <Check className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-warning" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{urge.emotion} · intensity {urge.intensity}/10</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-3">
            {selected?.review?.reviewedAt && (
              <div className="rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-sm text-muted-foreground">
                This urge already has a review. Saving again updates the reflection without extra XP.
              </div>
            )}
            <div>
              <Label>What happened?</Label>
              <Textarea value={form.whatHappened} onChange={e => setForm({ ...form, whatHappened: e.target.value })} rows={3} placeholder={selected?.notes || 'Describe the event plainly.'} />
            </div>
            <div>
              <Label>What triggered it?</Label>
              <Textarea value={form.whatTriggered} onChange={e => setForm({ ...form, whatTriggered: e.target.value })} rows={2} placeholder={selected ? `${selected.trigger}, ${selected.context || 'context unknown'}` : ''} />
            </div>
            <div>
              <Label>What changes next time?</Label>
              <Textarea value={form.nextChange} onChange={e => setForm({ ...form, nextChange: e.target.value })} rows={2} placeholder="One small environmental or replacement change." />
            </div>
            <div>
              <Label>Replacement to try next</Label>
              <Select value={form.nextReplacementActionId || 'none'} onValueChange={value => setForm({ ...form, nextReplacementActionId: value === 'none' ? '' : value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No replacement selected</SelectItem>
                  {replacements.map(action => <SelectItem key={action.id} value={action.id}>{action.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveReview} disabled={updateUrge.isPending} className="w-full sm:w-auto">
              Save review
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-subtle surface-sunken p-4">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">30d</span>
      </div>
      <p className="text-2xl font-semibold text-foreground tabular-nums mt-3">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {hint && <p className="text-[11px] text-muted-foreground/80 mt-1">{hint}</p>}
    </div>
  );
}

function UrgeRow({ urge, target }: { urge: UrgeLog; target?: DisciplineTarget }) {
  const outcomeTone = urge.outcome === 'interrupted' ? 'text-success' : urge.outcome === 'delayed' ? 'text-primary' : 'text-warning';
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-subtle bg-background/40 px-3 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold capitalize ${outcomeTone}`}>{urge.outcome}</span>
          <span className="text-sm font-medium text-foreground truncate">{target?.name ?? 'Unassigned target'}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{urge.trigger} · {urge.emotion} · intensity {urge.intensity}/10</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{new Date(urge.occurredAt).toLocaleDateString()}</span>
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map(item => item.count));
  return (
    <div className="rounded-lg border border-subtle bg-background/40 p-4">
      <h3 className="font-semibold text-foreground mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pattern yet.</p>
      ) : items.map(item => (
        <div key={item.label} className="py-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-foreground">{item.label}</span>
            <span className="text-muted-foreground">{item.count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full gradient-primary" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function OutcomeButton({ outcome, active, onClick }: { outcome: UrgeOutcome; active: boolean; onClick: () => void }) {
  const label = outcome === 'interrupted' ? 'Interrupted' : outcome === 'delayed' ? 'Delayed' : 'Relapsed';
  const Icon = outcome === 'interrupted' ? ShieldCheck : outcome === 'delayed' ? Timer : AlertTriangle;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
        active ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-background/40 text-muted-foreground hover:border-primary/30'
      }`}
    >
      <Icon className="h-4 w-4 mx-auto mb-1" />
      {label}
    </button>
  );
}

function EmptyDisciplineState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background/40 p-6 text-center">
      <Flame className="h-8 w-8 text-primary mx-auto mb-2" />
      <p className="font-medium text-foreground">No discipline target yet.</p>
      <p className="text-sm text-muted-foreground mt-1">Start with one behavior that reliably pulls you off track.</p>
    </div>
  );
}

function formatHour(hour?: number) {
  if (hour === undefined) return '-';
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric' });
}
