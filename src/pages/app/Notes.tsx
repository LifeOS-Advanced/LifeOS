import { useState } from 'react';
import { getNotes, setNotes, getTasks, getGoals } from '@/lib/store';
import { Note, LifeArea } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pin, Trash2, BookOpen, CheckSquare, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { LifeAreaBadge } from '@/components/app/LifeAreaBadge';
import { LifeAreaSelect } from '@/components/app/LifeAreaSelect';
import { LifeAreaFilter } from '@/components/app/LifeAreaFilter';
import { EmptyState } from '@/components/app/EmptyState';
import { useNewParam } from '@/hooks/use-new-param';

export default function Notes() {
  const tasks = getTasks();
  const goals = getGoals();
  const [notes, setLocalNotes] = useState(getNotes());
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<LifeArea | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [form, setForm] = useState<{ title: string; content: string; tags: string; lifeArea?: LifeArea; taskId?: string; goalId?: string }>({ title: '', content: '', tags: '' });

  useNewParam(() => setDialogOpen(true));

  const save = (updated: Note[]) => { setLocalNotes(updated); setNotes(updated); };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    const tagArr = form.tags.split(',').map(s => s.trim()).filter(Boolean);
    if (editingNote) {
      save(notes.map(n => n.id === editingNote.id ? { ...n, title: form.title, content: form.content, tags: tagArr, lifeArea: form.lifeArea, taskId: form.taskId, goalId: form.goalId, updatedAt: now } : n));
    } else {
      const newNote: Note = { id: `n${Date.now()}`, title: form.title, content: form.content, tags: tagArr, pinned: false, lifeArea: form.lifeArea, taskId: form.taskId, goalId: form.goalId, createdAt: now, updatedAt: now };
      save([newNote, ...notes]);
    }
    resetForm();
  };

  const resetForm = () => { setForm({ title: '', content: '', tags: '' }); setEditingNote(null); setDialogOpen(false); };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setForm({ title: note.title, content: note.content, tags: note.tags.join(', '), lifeArea: note.lifeArea, taskId: note.taskId, goalId: note.goalId });
    setDialogOpen(true);
  };

  const togglePin = (id: string) => save(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  const deleteNote = (id: string) => save(notes.filter(n => n.id !== id));

  const filtered = notes.filter(n => {
    if (areaFilter !== 'all' && n.lifeArea !== areaFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s) || n.tags.some(t => t.toLowerCase().includes(s));
  });

  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          <p className="text-muted-foreground text-sm">Capture ideas, attach them to what matters.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={v => { if (!v) resetForm(); setDialogOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90"><Plus className="h-4 w-4 mr-2" />New Note</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Note title" /></div>
              <div><Label>Content</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your thoughts..." rows={6} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Life Area</Label><LifeAreaSelect value={form.lifeArea} onChange={v => setForm({ ...form, lifeArea: v })} /></div>
                <div><Label>Tags</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="ideas, work" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Attach to Task</Label>
                  <Select value={form.taskId ?? 'none'} onValueChange={v => setForm({ ...form, taskId: v === 'none' ? undefined : v })}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {tasks.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Attach to Goal</Label>
                  <Select value={form.goalId ?? 'none'} onValueChange={v => setForm({ ...form, goalId: v === 'none' ? undefined : v })}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {goals.map(g => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground">{editingNote ? 'Save' : 'Create Note'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <LifeAreaFilter value={areaFilter} onChange={setAreaFilter} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No notes yet"
          description="Your future self will thank you for writing things down. Capture one thought."
          ctaLabel="Create Note"
          onCta={() => setDialogOpen(true)}
          tip="Pin notes you reference often — they stay at the top."
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card text-center py-16">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No notes match your search.</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><Pin className="h-3.5 w-3.5" />Pinned</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinned.map((note, i) => <NoteCard key={note.id} note={note} index={i} tasks={tasks} goals={goals} onEdit={openEdit} onPin={togglePin} onDelete={deleteNote} />)}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground mb-3">Other Notes</h2>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinned.map((note, i) => <NoteCard key={note.id} note={note} index={i} tasks={tasks} goals={goals} onEdit={openEdit} onPin={togglePin} onDelete={deleteNote} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NoteCard({ note, index, tasks, goals, onEdit, onPin, onDelete }: { note: Note; index: number; tasks: ReturnType<typeof getTasks>; goals: ReturnType<typeof getGoals>; onEdit: (n: Note) => void; onPin: (id: string) => void; onDelete: (id: string) => void }) {
  const linkedTask = note.taskId ? tasks.find(t => t.id === note.taskId) : undefined;
  const linkedGoal = note.goalId ? goals.find(g => g.id === note.goalId) : undefined;
  return (
    <motion.div
      className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-all group cursor-pointer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onEdit(note)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-foreground text-sm">{note.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={() => onPin(note.id)} className={`p-1 rounded ${note.pinned ? 'text-warning' : 'text-muted-foreground hover:text-warning'}`}><Pin className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDelete(note.id)} className="p-1 rounded text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{note.content}</p>
      <div className="flex flex-wrap gap-1.5">
        <LifeAreaBadge area={note.lifeArea} />
        {linkedTask && (
          <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            <CheckSquare className="h-3 w-3" />{linkedTask.title}
          </span>
        )}
        {linkedGoal && (
          <span className="inline-flex items-center gap-1 text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
            <Target className="h-3 w-3" />{linkedGoal.title}
          </span>
        )}
        {note.tags.map(t => <span key={t} className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{t}</span>)}
      </div>
    </motion.div>
  );
}
