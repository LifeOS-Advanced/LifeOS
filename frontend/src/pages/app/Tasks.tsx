import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task, TaskStatus, TaskPriority, LifeArea, RecurrenceFrequency, Subtask, EnergyRequired } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, LayoutGrid, List, Trash2, Edit2, Target, CheckSquare, Repeat, ChevronDown, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { LifeAreaBadge } from '@/components/app/LifeAreaBadge';
import { LifeAreaSelect } from '@/components/app/LifeAreaSelect';
import { LifeAreaFilter } from '@/components/app/LifeAreaFilter';
import { EmptyState } from '@/components/app/EmptyState';
import { TaskCheckbox } from '@/components/app/TaskCheckbox';
import { useNewParam } from '@/hooks/use-new-param';
import { taskFormSchema, validateOrToast } from '@/lib/schemas';
import { useCreateTask, useDeleteTask, useGoals, useProfile, useRecordProgressEvent, useSaveProfile, useTasks, useUpdateSubtask, useUpdateTask, useUpdateTaskStatus } from '@/lib/queries';
import { DEFAULT_PREFERENCES } from '@/lib/types';
import { emitRewardMoment } from '@/lib/reward-feedback';

const WEEKDAYS = [
  { i: 0, l: 'S' }, { i: 1, l: 'M' }, { i: 2, l: 'T' }, { i: 3, l: 'W' },
  { i: 4, l: 'T' }, { i: 5, l: 'F' }, { i: 6, l: 'S' },
];

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const goalFilter = searchParams.get('goalId');
  const { data: goals = [] } = useGoals();
  const { data: profile } = useProfile();
  const saveProfile = useSaveProfile();
  const { data: tasks = [], isLoading } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const updateSubtaskMutation = useUpdateSubtask();
  const deleteTaskMutation = useDeleteTask();
  const recordProgress = useRecordProgressEvent();
  const tasksView = profile?.preferences?.tasksView;
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(tasksView?.filterStatus ?? 'all');
  const [filterPriority, setFilterPriority] = useState(tasksView?.filterPriority ?? 'all');
  const [areaFilter, setAreaFilter] = useState<LifeArea | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>(tasksView?.viewMode ?? 'list');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<{
    title: string; description: string; priority: TaskPriority; status: TaskStatus;
    importance: number; urgency: number; effort: number; energyRequired: EnergyRequired;
    dueDate: string; tags: string; goalId?: string; lifeArea?: LifeArea;
    recurrence: RecurrenceFrequency; daysOfWeek: number[]; subtasks: Subtask[];
  }>({
    title: '', description: '', priority: 'medium', status: 'todo',
    importance: 3, urgency: 3, effort: 3, energyRequired: 'medium',
    dueDate: '', tags: '', recurrence: 'none', daysOfWeek: [], subtasks: []
  });
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useNewParam(() => setDialogOpen(true));

  useEffect(() => {
    if (!profile) return;
    const prefs = profile.preferences ?? DEFAULT_PREFERENCES;
    const next = { ...prefs, tasksView: { viewMode, filterStatus, filterPriority } };
    if (
      prefs.tasksView?.viewMode === viewMode &&
      prefs.tasksView?.filterStatus === filterStatus &&
      prefs.tasksView?.filterPriority === filterPriority
    ) return;
    saveProfile.mutate({ ...profile, preferences: next });
  }, [viewMode, filterStatus, filterPriority]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toISOString().split('T')[0];

  const filtered = tasks.filter(t => {
    if (goalFilter && t.goalId !== goalFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (areaFilter !== 'all' && t.lifeArea !== areaFilter) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkComplete = () => {
    selected.forEach(id => {
      const t = tasks.find(x => x.id === id);
      if (t && t.status !== 'done') updateStatus(id, 'done');
    });
    setSelected(new Set());
    toast.success('Tasks completed');
  };

  const bulkDueToday = () => {
    selected.forEach(id => updateTaskMutation.mutate({ id, updates: { dueDate: today } }));
    setSelected(new Set());
    toast.success('Due dates set to today');
  };

  const smartGroups = useMemo(() => {
    const open = tasks.filter(t => t.status !== 'done');
    return [
      { label: 'Do First', hint: 'High importance + high urgency', items: open.filter(t => t.importance >= 4 && t.urgency >= 4), tone: 'text-destructive' },
      { label: 'Quick Wins', hint: 'High importance + low effort', items: open.filter(t => t.importance >= 4 && t.effort <= 2), tone: 'text-success' },
      { label: 'Schedule', hint: 'High importance + low urgency', items: open.filter(t => t.importance >= 4 && t.urgency <= 2), tone: 'text-primary' },
      { label: 'Maybe Later', hint: 'Low importance', items: open.filter(t => t.importance <= 2), tone: 'text-muted-foreground' },
    ];
  }, [tasks]);

  const handleSubmit = async () => {
    const valid = validateOrToast(taskFormSchema, {
      title: form.title,
      description: form.description,
      priority: form.priority,
      importance: form.importance,
      urgency: form.urgency,
      effort: form.effort,
      energyRequired: form.energyRequired,
      status: form.status,
      dueDate: form.dueDate,
      tags: form.tags,
      recurrence: form.recurrence,
      daysOfWeek: form.daysOfWeek,
    });
    if (!valid) return;
    const tagArr = form.tags.split(',').map(s => s.trim()).filter(Boolean);
    const recurrence = form.recurrence === 'none'
      ? undefined
      : { frequency: form.recurrence, daysOfWeek: form.recurrence === 'weekly' ? form.daysOfWeek : undefined };
    const payload: Omit<Task, 'id' | 'createdAt'> = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      importance: form.importance,
      urgency: form.urgency,
      effort: form.effort,
      energyRequired: form.energyRequired,
      dueDate: form.dueDate,
      tags: tagArr,
      goalId: form.goalId,
      lifeArea: form.lifeArea,
      subtasks: form.subtasks.length ? form.subtasks : undefined,
      recurrence,
      lastGeneratedDate: recurrence ? (editingTask?.lastGeneratedDate ?? form.dueDate) || new Date().toISOString().split('T')[0] : undefined,
    };

    try {
      if (editingTask) {
        await updateTaskMutation.mutateAsync({ id: editingTask.id, updates: payload });
      } else {
        await createTaskMutation.mutateAsync(payload);
      }
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save task');
    }
  };

  const resetForm = () => {
    setForm({
      title: '', description: '', priority: 'medium', status: 'todo',
      importance: 3, urgency: 3, effort: 3, energyRequired: 'medium',
      dueDate: '', tags: '', recurrence: 'none', daysOfWeek: [], subtasks: []
    });
    setSubtaskDraft('');
    setEditingTask(null);
    setDialogOpen(false);
  };
  const deleteTask = (id: string) => {
    deleteTaskMutation.mutate(id, {
      onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not delete task'),
    });
  };
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title, description: task.description || '', priority: task.priority, status: task.status,
      importance: task.importance ?? 3, urgency: task.urgency ?? 3, effort: task.effort ?? 3, energyRequired: task.energyRequired ?? 'medium',
      dueDate: task.dueDate || '', tags: task.tags.join(', '), goalId: task.goalId, lifeArea: task.lifeArea,
      recurrence: task.recurrence?.frequency ?? 'none',
      daysOfWeek: task.recurrence?.daysOfWeek ?? [],
      subtasks: task.subtasks ? [...task.subtasks] : [],
    });
    setDialogOpen(true);
  };

  const addSubtaskToForm = () => {
    if (!subtaskDraft.trim()) return;
    setForm(f => ({ ...f, subtasks: [...f.subtasks, { id: `s${Date.now()}`, title: subtaskDraft.trim(), done: false }] }));
    setSubtaskDraft('');
  };
  const removeFormSubtask = (id: string) => setForm(f => ({ ...f, subtasks: f.subtasks.filter(s => s.id !== id) }));
  const toggleDayOfWeek = (i: number) => setForm(f => ({
    ...f, daysOfWeek: f.daysOfWeek.includes(i) ? f.daysOfWeek.filter(x => x !== i) : [...f.daysOfWeek, i].sort()
  }));

  const toggleSubtaskOnTask = (taskId: string, subId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const subtask = task?.subtasks?.find(s => s.id === subId);
    if (!subtask) return;
    updateSubtaskMutation.mutate(
      { taskId, subtaskId: subId, done: !subtask.done },
      { onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not update subtask') },
    );
  };
  const updateStatus = (id: string, status: TaskStatus) => {
    const prev = tasks.find(t => t.id === id);
    updateStatusMutation.mutate(
      { id, status },
      {
        onSuccess: async () => {
          if (status === 'done' && prev?.status !== 'done') {
            toast.success('Task complete', { description: prev?.title });
            try {
              const progress = await recordProgress.mutateAsync({
                type: 'task_completed',
                entityId: id,
                title: 'Task completed',
                description: prev.title,
                metadata: { goalId: prev.goalId, lifeArea: prev.lifeArea },
              });
              emitRewardMoment(progress);
            } catch {
              // Reward feedback is non-critical; the task update already succeeded.
            }
          }
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not update task'),
      },
    );
  };
  const toggleDone = (task: Task, checked: boolean) => updateStatus(task.id, checked ? 'done' : 'todo');

  const statusCols: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'To Do', color: 'bg-secondary' },
    { status: 'in-progress', label: 'In Progress', color: 'bg-warning/10' },
    { status: 'done', label: 'Done', color: 'bg-success/10' },
  ];

  const priorityBadge = (p: TaskPriority) => {
    const cls = p === 'high' ? 'bg-destructive/10 text-destructive' : p === 'medium' ? 'bg-warning/10 text-warning' : 'bg-secondary text-muted-foreground';
    return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{p}</span>;
  };
  const scoreBadge = (label: string, value: number) => (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{label}{value}</span>
  );

  const goalChip = (goalId?: string) => {
    if (!goalId) return null;
    const g = goals.find(x => x.id === goalId);
    if (!g) return null;
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
        <Target className="h-3 w-3" />{g.title}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {goalFilter && (
        <p className="text-sm text-muted-foreground">
          Filtered by goal: <span className="font-medium text-foreground">{goals.find(g => g.id === goalFilter)?.title}</span>
        </p>
      )}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="secondary" onClick={bulkComplete}>Complete</Button>
          <Button size="sm" variant="secondary" onClick={bulkDueToday}>Due today</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm">Organize and track your work.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={v => { if (!v) resetForm(); setDialogOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4 mr-2" />Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v as TaskPriority })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as TaskStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="todo">To Do</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ScoreSelect label="Importance" value={form.importance} onChange={(importance) => setForm({ ...form, importance })} />
                <ScoreSelect label="Urgency" value={form.urgency} onChange={(urgency) => setForm({ ...form, urgency })} />
                <ScoreSelect label="Effort" value={form.effort} onChange={(effort) => setForm({ ...form, effort })} />
                <div><Label>Energy</Label>
                  <Select value={form.energyRequired} onValueChange={v => setForm({ ...form, energyRequired: v as EnergyRequired })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Life Area</Label><LifeAreaSelect value={form.lifeArea} onChange={v => setForm({ ...form, lifeArea: v })} /></div>
                <div><Label>Linked Goal</Label>
                  <Select value={form.goalId ?? 'none'} onValueChange={v => setForm({ ...form, goalId: v === 'none' ? undefined : v })}>
                    <SelectTrigger><SelectValue placeholder="No goal" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No goal</SelectItem>
                      {goals.map(g => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
              <div>
                <Label>Repeats</Label>
                <Select value={form.recurrence} onValueChange={v => setForm({ ...form, recurrence: v as RecurrenceFrequency })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Does not repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                {form.recurrence === 'weekly' && (
                  <div className="flex gap-1 mt-2">
                    {WEEKDAYS.map(d => (
                      <button key={d.i} type="button" onClick={() => toggleDayOfWeek(d.i)}
                        className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${form.daysOfWeek.includes(d.i) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                        {d.l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Subtasks</Label>
                <div className="space-y-1.5">
                  {form.subtasks.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">{s.title}</span>
                      <button type="button" onClick={() => removeFormSubtask(s.id)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input value={subtaskDraft} onChange={e => setSubtaskDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtaskToForm(); } }}
                      placeholder="Add subtask and press Enter" />
                    <Button type="button" variant="outline" onClick={addSubtaskToForm}>Add</Button>
                  </div>
                </div>
              </div>
              <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="work, personal" /></div>
              <Button
                onClick={handleSubmit}
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                className="w-full gradient-primary text-primary-foreground"
              >
                {editingTask ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <LifeAreaFilter value={areaFilter} onChange={setAreaFilter} />

      {tasks.length > 0 && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {smartGroups.map(group => (
            <div key={group.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className={`text-sm font-semibold ${group.tone}`}>{group.label}</h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{group.hint}</p>
                </div>
                <span className="text-lg font-semibold tabular-nums text-foreground">{group.items.length}</span>
              </div>
              {group.items[0] && <p className="text-xs text-muted-foreground mt-3 truncate">{group.items[0].title}</p>}
            </div>
          ))}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="todo">To Do</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Priority</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
        </Select>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}><List className="h-4 w-4" /></button>
          <button onClick={() => setViewMode('board')} className={`p-2 ${viewMode === 'board' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}><LayoutGrid className="h-4 w-4" /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card shadow-card text-center py-12 text-muted-foreground">
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Add your first task and turn chaos into something slightly less embarrassing."
          ctaLabel="Create Task"
          onCta={() => setDialogOpen(true)}
          tip="Press CTRL + K anywhere to quickly add a task."
        />
      ) : viewMode === 'list' ? (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No tasks match your filters.</div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map(task => {
                const subs = task.subtasks ?? [];
                const subDone = subs.filter(s => s.done).length;
                const isExp = expanded[task.id];
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8, transition: { duration: 0.18 } }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="border-b border-subtle last:border-0 hover:bg-secondary/40 data-[done=true]:bg-success/[0.03] transition-colors group"
                    data-done={task.status === 'done'}
                  >
                    <div className="flex items-center gap-3 px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="h-4 w-4 rounded border-border shrink-0"
                        aria-label={`Select ${task.title}`}
                      />
                      <TaskCheckbox checked={task.status === 'done'} onChange={(c) => toggleDone(task, c)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {subs.length > 0 && (
                            <button onClick={() => setExpanded(e => ({ ...e, [task.id]: !e[task.id] }))} className="text-muted-foreground hover:text-foreground">
                              {isExp ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <p className={`text-sm font-medium transition-colors truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <LifeAreaBadge area={task.lifeArea} />
                          {goalChip(task.goalId)}
                          {(task.recurrence && task.recurrence.frequency !== 'none') && (
                            <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent-foreground px-2 py-0.5 rounded-full">
                              <Repeat className="h-3 w-3" />{task.recurrence.frequency}
                            </span>
                          )}
                          {subs.length > 0 && (
                            <span className="text-xs text-muted-foreground">{subDone}/{subs.length} subtasks</span>
                          )}
                          {scoreBadge('I', task.importance)}
                          {scoreBadge('U', task.urgency)}
                          {scoreBadge('E', task.effort)}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize">{task.energyRequired} energy</span>
                          {task.tags.map(t => <span key={t} className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{t}</span>)}
                        </div>
                      </div>
                      {priorityBadge(task.priority)}
                      {task.dueDate && <span className="text-xs text-muted-foreground hidden sm:block tabular-nums">{task.dueDate}</span>}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(task)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    {isExp && subs.length > 0 && (
                      <div className="pl-14 pr-5 pb-3 space-y-1.5">
                        {subs.map(s => (
                          <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={s.done} onChange={() => toggleSubtaskOnTask(task.id, s.id)}
                              className="h-3.5 w-3.5 rounded border-border accent-primary" />
                            <span className={s.done ? 'line-through text-muted-foreground' : 'text-foreground'}>{s.title}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusCols.map(col => (
            <div key={col.status} className="rounded-xl border border-border bg-card shadow-card">
              <div className={`px-4 py-3 border-b border-border ${col.color} rounded-t-xl`}>
                <h3 className="text-sm font-semibold text-foreground">{col.label} ({filtered.filter(t => t.status === col.status).length})</h3>
              </div>
              <div className="p-3 space-y-2 min-h-[100px]">
                {filtered.filter(t => t.status === col.status).map(task => (
                  <div key={task.id} className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-card transition-shadow group">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(task)} className="p-1 rounded hover:bg-secondary text-muted-foreground"><Edit2 className="h-3 w-3" /></button>
                        <button onClick={() => deleteTask(task.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {priorityBadge(task.priority)}
                      {scoreBadge('I', task.importance)}
                      {scoreBadge('U', task.urgency)}
                      <LifeAreaBadge area={task.lifeArea} />
                      {task.dueDate && <span className="text-xs text-muted-foreground">{task.dueDate}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreSelect({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
