import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Note, LifeArea } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pin, Trash2, BookOpen, CheckSquare, Target, Folder, FolderPlus, Link2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { LifeAreaBadge } from '@/components/app/LifeAreaBadge';
import { LifeAreaSelect } from '@/components/app/LifeAreaSelect';
import { LifeAreaFilter } from '@/components/app/LifeAreaFilter';
import { EmptyState } from '@/components/app/EmptyState';
import { useNewParam } from '@/hooks/use-new-param';
import { RichEditor, NOTE_TEMPLATES, htmlToText } from '@/components/app/RichEditor';
import { noteFormSchema, validateOrToast } from '@/lib/schemas';
import { downloadNoteMarkdown } from '@/lib/note-export';
import {
  useCreateNote,
  useDeleteNote,
  useGoals,
  useNotes,
  useTasks,
  useToggleNotePin,
  useUpdateNote,
} from '@/lib/queries';

export default function Notes() {
  const [searchParams] = useSearchParams();
  const goalFilter = searchParams.get('goalId');
  const { data: tasks = [] } = useTasks();
  const { data: goals = [] } = useGoals();
  const [search, setSearch] = useState('');
  const { data: notes = [], isLoading } = useNotes(search.length >= 2 ? search : undefined);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const togglePin = useToggleNotePin();
  const deleteNoteMutation = useDeleteNote();
  const [areaFilter, setAreaFilter] = useState<LifeArea | 'all'>('all');
  const [folderFilter, setFolderFilter] = useState<string | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [form, setForm] = useState<{ title: string; content: string; tags: string; lifeArea?: LifeArea; taskId?: string; goalId?: string; folder?: string; template: string }>({ title: '', content: '', tags: '', template: 'blank' });

  useNewParam(() => setDialogOpen(true));

  const folders = useMemo(() => Array.from(new Set(notes.map(n => n.folder).filter(Boolean) as string[])).sort(), [notes]);

  const backlinksFor = (note: Note) =>
    notes.filter(n => n.id !== note.id && n.content.toLowerCase().includes(`[[${note.title.toLowerCase()}]]`));

  const handleSubmit = async () => {
    const valid = validateOrToast(noteFormSchema, { title: form.title, content: form.content, tags: form.tags, folder: form.folder });
    if (!valid) return;
    const tagArr = form.tags.split(',').map(s => s.trim()).filter(Boolean);
    const folder = form.folder?.trim() || undefined;
    const payload = {
      title: form.title,
      content: form.content,
      tags: tagArr,
      pinned: editingNote?.pinned ?? false,
      lifeArea: form.lifeArea,
      taskId: form.taskId,
      goalId: form.goalId,
      folder,
    };
    try {
      if (editingNote) {
        await updateNote.mutateAsync({ id: editingNote.id, updates: payload });
      } else {
        await createNote.mutateAsync(payload);
      }
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save note');
    }
  };

  const resetForm = () => { setForm({ title: '', content: '', tags: '', template: 'blank' }); setEditingNote(null); setDialogOpen(false); };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setForm({ title: note.title, content: note.content, tags: note.tags.join(', '), lifeArea: note.lifeArea, taskId: note.taskId, goalId: note.goalId, folder: note.folder, template: 'blank' });
    setDialogOpen(true);
  };

  const handleTogglePin = async (id: string) => {
    try {
      await togglePin.mutateAsync(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update pin');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNoteMutation.mutateAsync(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete note');
    }
  };

  const applyTemplate = (id: string) => {
    setForm(f => ({ ...f, template: id, content: NOTE_TEMPLATES.find(t => t.id === id)?.content ?? f.content }));
  };

  const filtered = notes.filter(n => {
    if (goalFilter && n.goalId !== goalFilter) return false;
    if (areaFilter !== 'all' && n.lifeArea !== areaFilter) return false;
    if (folderFilter !== 'all' && (n.folder ?? '') !== folderFilter) return false;
    if (!search || search.length >= 2) return true;
    const s = search.toLowerCase();
    return n.title.toLowerCase().includes(s) || htmlToText(n.content).toLowerCase().includes(s) || n.tags.some(t => t.toLowerCase().includes(s));
  });

  const pinned = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);
  const recent = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  if (isLoading) {
    return <div className="max-w-6xl mx-auto h-48 rounded-xl bg-secondary/50 animate-pulse" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {goalFilter && (
        <p className="text-sm text-muted-foreground">
          Showing notes for goal: <span className="text-foreground font-medium">{goals.find(g => g.id === goalFilter)?.title ?? goalFilter}</span>
        </p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          <p className="text-muted-foreground text-sm">Your second brain. Use <code className="text-xs bg-secondary px-1 rounded">[[Note title]]</code> to link notes.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={v => { if (!v) resetForm(); setDialogOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90"><Plus className="h-4 w-4 mr-2" />New Note</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              {!editingNote && (
                <div>
                  <Label>Template</Label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {NOTE_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.template === t.id ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Note title" /></div>
              <div><Label>Content</Label><RichEditor value={form.content} onChange={c => setForm({ ...form, content: c })} placeholder="Write your thoughts..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Folder</Label>
                  <Input value={form.folder ?? ''} onChange={e => setForm({ ...form, folder: e.target.value })} placeholder="e.g. Research" list="note-folders" />
                  <datalist id="note-folders">{folders.map(f => <option key={f} value={f} />)}</datalist>
                </div>
                <div><Label>Life Area</Label><LifeAreaSelect value={form.lifeArea} onChange={v => setForm({ ...form, lifeArea: v })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tags</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="ideas, work" /></div>
                <div><Label>Attach to Task</Label>
                  <Select value={form.taskId ?? 'none'} onValueChange={v => setForm({ ...form, taskId: v === 'none' ? undefined : v })}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {tasks.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
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
              {editingNote && (
                <div className="rounded-lg border border-border p-3 bg-secondary/30 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Link2 className="h-3 w-3" />Backlinks</div>
                  {backlinksFor(editingNote).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No notes link here yet. Reference this note as <code className="bg-background px-1 rounded">[[{editingNote.title}]]</code></p>
                  ) : (
                    <ul className="space-y-1">
                      {backlinksFor(editingNote).map(n => (
                        <li key={n.id}>
                          <button type="button" onClick={() => openEdit(n)} className="text-xs text-primary hover:underline">{n.title}</button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => downloadNoteMarkdown(editingNote)}>
                    <Download className="h-3.5 w-3.5 mr-2" />Export Markdown
                  </Button>
                </div>
              )}
              <Button onClick={handleSubmit} disabled={createNote.isPending || updateNote.isPending} className="w-full gradient-primary text-primary-foreground">{editingNote ? 'Save' : 'Create Note'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <LifeAreaFilter value={areaFilter} onChange={setAreaFilter} />

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFolderFilter('all')} className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${folderFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
          <Folder className="h-3 w-3" />All
        </button>
        {folders.map(f => (
          <button key={f} onClick={() => setFolderFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${folderFilter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            <Folder className="h-3 w-3" />{f}
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search notes (2+ chars uses server)..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={BookOpen} title="No notes yet" description="Your future self will thank you for writing things down." ctaLabel="Create Note" onCta={() => setDialogOpen(true)} tip="Pin notes you reference often." />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card text-center py-16">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No notes match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
          <div className="space-y-6">
            {pinned.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><Pin className="h-3.5 w-3.5" />Pinned</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pinned.map((note, i) => <NoteCard key={note.id} note={note} index={i} tasks={tasks} goals={goals} backlinks={backlinksFor(note).length} onEdit={openEdit} onPin={handleTogglePin} onDelete={handleDelete} />)}
                </div>
              </div>
            )}
            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground mb-3">Other Notes</h2>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unpinned.map((note, i) => <NoteCard key={note.id} note={note} index={i} tasks={tasks} goals={goals} backlinks={backlinksFor(note).length} onEdit={openEdit} onPin={handleTogglePin} onDelete={handleDelete} />)}
                </div>
              </div>
            )}
          </div>
          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">Recent edits</h3>
              <ul className="space-y-2">
                {recent.map(n => (
                  <li key={n.id}>
                    <button onClick={() => openEdit(n)} className="text-sm text-foreground hover:text-primary text-left w-full truncate">{n.title}</button>
                    <p className="text-[10px] text-muted-foreground">{new Date(n.updatedAt).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, index, tasks, goals, backlinks, onEdit, onPin, onDelete }: {
  note: Note; index: number; tasks: { id: string; title: string }[]; goals: { id: string; title: string }[];
  backlinks: number; onEdit: (n: Note) => void; onPin: (id: string) => void; onDelete: (id: string) => void;
}) {
  const linkedTask = note.taskId ? tasks.find(t => t.id === note.taskId) : undefined;
  const linkedGoal = note.goalId ? goals.find(g => g.id === note.goalId) : undefined;
  const preview = htmlToText(note.content).slice(0, 160);
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
      <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{preview}</p>
      <div className="flex flex-wrap gap-1.5">
        <LifeAreaBadge area={note.lifeArea} />
        {note.folder && <span className="inline-flex items-center gap-1 text-xs bg-secondary text-foreground px-2 py-0.5 rounded-full"><Folder className="h-3 w-3" />{note.folder}</span>}
        {backlinks > 0 && <span className="inline-flex items-center gap-1 text-xs bg-info/10 text-info px-2 py-0.5 rounded-full"><Link2 className="h-3 w-3" />{backlinks}</span>}
        {linkedTask && <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"><CheckSquare className="h-3 w-3" />{linkedTask.title}</span>}
        {linkedGoal && <span className="inline-flex items-center gap-1 text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full"><Target className="h-3 w-3" />{linkedGoal.title}</span>}
        {note.tags.map(t => <span key={t} className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{t}</span>)}
      </div>
    </motion.div>
  );
}
