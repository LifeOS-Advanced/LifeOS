import { htmlToText } from '@/components/app/RichEditor';
import type { Note } from './types';

export function noteToMarkdown(note: Note): string {
  const body = htmlToText(note.content).trim();
  const meta = [
    note.folder ? `folder: ${note.folder}` : '',
    note.lifeArea ? `area: ${note.lifeArea}` : '',
    note.tags.length ? `tags: ${note.tags.join(', ')}` : '',
  ].filter(Boolean);
  return `# ${note.title}\n\n${meta.length ? `> ${meta.join(' · ')}\n\n` : ''}${body}\n`;
}

export function downloadNoteMarkdown(note: Note) {
  const md = noteToMarkdown(note);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${note.title.replace(/[^\w\s-]/g, '').trim() || 'note'}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
