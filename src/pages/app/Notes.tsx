import { useState } from 'react';
import { getNotes, setNotes } from '@/lib/store';
import { Note } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Pin, Trash2, Edit2, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Notes() {
  const [notes, setLocalNotes] = useState(getNotes());
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: '', content: '', tags: '' });

  const save = (updated: Note[]) => { setLocalNotes(updated); setNotes(updated); };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString();
    if (editingNote) {
      save(notes.map(n => n.id === editingNote.id ? { ...n, title: form.title, content: form.content, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean), updatedAt: now } : n));
    } else {
      const newNote: Note = { id: `n${Date.now()}`, title: form.title, content: form.content, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean), pinned: false, createdAt: now, updatedAt: now };
      save([newNote, ...notes]);
    }
    resetForm();
  };

  const resetForm = () => { setForm({ title: '', content: '', tags: '' }); setEditingNote(null); setDialogOpen(false); };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setForm({ title: note.title, content: note.content, tags: note.tags.join(', ') });
    setDialogOpen(true);
  };

  const togglePin = (id: string) => save(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  const deleteNote = (id: string) => save(notes.filter(n => n.id !== id));

  const filtered = notes.filter(n => {
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
          <p className="text-muted-foreground text-sm">Capture ideas, thoughts, and knowledge.</p>
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
              <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="ideas, work" /></div>
              <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground">{editingNote ? 'Save' : 'Create Note'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card text-center py-16">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No notes yet. Start writing!</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5"><Pin className="h-3.5 w-3.5" />Pinned</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinned.map((note, i) => <NoteCard key={note.id} note={note} index={i} onEdit={openEdit} onPin={togglePin} onDelete={deleteNote} />)}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground mb-3">Other Notes</h2>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinned.map((note, i) => <NoteCard key={note.id} note={note} index={i} onEdit={openEdit} onPin={togglePin} onDelete={deleteNote} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NoteCard({ note, index, onEdit, onPin, onDelete }: { note: Note; index: number; onEdit: (n: Note) => void; onPin: (id: string) => void; onDelete: (id: string) => void }) {
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
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.map(t => <span key={t} className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{t}</span>)}
        </div>
      )}
    </motion.div>
  );
}
