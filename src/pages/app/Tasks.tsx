import { useState } from 'react';
import { getTasks, setTasks, getGoals } from '@/lib/store';
import { Task, TaskStatus, TaskPriority, LifeArea } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, LayoutGrid, List, Trash2, Edit2, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { LifeAreaBadge } from '@/components/app/LifeAreaBadge';
import { LifeAreaSelect } from '@/components/app/LifeAreaSelect';
import { LifeAreaFilter } from '@/components/app/LifeAreaFilter';

export default function Tasks() {
  const goals = getGoals();
  const [tasks, setLocalTasks] = useState(getTasks());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<LifeArea | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; priority: TaskPriority; status: TaskStatus; dueDate: string; tags: string; goalId?: string; lifeArea?: LifeArea }>({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: '' });

  const save = (updated: Task[]) => { setLocalTasks(updated); setTasks(updated); };

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (areaFilter !== 'all' && t.lifeArea !== areaFilter) return false;
    return true;
  });

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const tagArr = form.tags.split(',').map(s => s.trim()).filter(Boolean);
    if (editingTask) {
      save(tasks.map(t => t.id === editingTask.id ? { ...t, ...form, tags: tagArr } : t));
    } else {
      const newTask: Task = { id: `t${Date.now()}`, title: form.title, description: form.description, status: form.status, priority: form.priority, dueDate: form.dueDate, tags: tagArr, goalId: form.goalId, lifeArea: form.lifeArea, createdAt: new Date().toISOString() };
      save([newTask, ...tasks]);
    }
    resetForm();
  };

  const resetForm = () => { setForm({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '', tags: '' }); setEditingTask(null); setDialogOpen(false); };
  const deleteTask = (id: string) => save(tasks.filter(t => t.id !== id));
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({ title: task.title, description: task.description || '', priority: task.priority, status: task.status, dueDate: task.dueDate || '', tags: task.tags.join(', '), goalId: task.goalId, lifeArea: task.lifeArea });
    setDialogOpen(true);
  };
  const updateStatus = (id: string, status: TaskStatus) => save(tasks.map(t => t.id === id ? { ...t, status } : t));

  const statusCols: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'todo', label: 'To Do', color: 'bg-secondary' },
    { status: 'in-progress', label: 'In Progress', color: 'bg-warning/10' },
    { status: 'done', label: 'Done', color: 'bg-success/10' },
  ];

  const priorityBadge = (p: TaskPriority) => {
    const cls = p === 'high' ? 'bg-destructive/10 text-destructive' : p === 'medium' ? 'bg-warning/10 text-warning' : 'bg-secondary text-muted-foreground';
    return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{p}</span>;
  };

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
              <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="work, personal" /></div>
              <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground">{editingTask ? 'Save Changes' : 'Create Task'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <LifeAreaFilter value={areaFilter} onChange={setAreaFilter} />

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

      {viewMode === 'list' ? (
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No tasks found.</div>
          ) : filtered.map(task => (
            <motion.div key={task.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors group" layout>
              <button onClick={() => updateStatus(task.id, task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in-progress' : 'done')} className={`h-5 w-5 rounded-full border-2 shrink-0 transition-colors ${task.status === 'done' ? 'border-success bg-success' : 'border-border hover:border-primary'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <LifeAreaBadge area={task.lifeArea} />
                  {goalChip(task.goalId)}
                  {task.tags.map(t => <span key={t} className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{t}</span>)}
                </div>
              </div>
              {priorityBadge(task.priority)}
              {task.dueDate && <span className="text-xs text-muted-foreground hidden sm:block">{task.dueDate}</span>}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(task)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </motion.div>
          ))}
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
