import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { type ReactNode, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Quote, Code, Heading1, Heading2, CheckSquare, Link as LinkIcon, Undo, Redo } from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
  title: string;
}

export function RichEditor({ value, onChange, placeholder = 'Start writing...', minHeight = 220 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-3 py-3',
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || '', { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const Btn = ({ onClick, active, children, title }: ToolbarButtonProps) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-secondary transition-colors ${active ? 'bg-secondary text-primary' : 'text-muted-foreground'}`}
    >
      {children}
    </button>
  );

  const setLink = () => {
    const url = window.prompt('URL');
    if (url === null) return;
    if (!url) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-secondary/30 flex-wrap">
        <Btn title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><Italic className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-4 bg-border mx-1" />
        <Btn title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}><Heading1 className="h-3.5 w-3.5" /></Btn>
        <Btn title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}><Heading2 className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-4 bg-border mx-1" />
        <Btn title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}><List className="h-3.5 w-3.5" /></Btn>
        <Btn title="Ordered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <Btn title="Task list" onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')}><CheckSquare className="h-3.5 w-3.5" /></Btn>
        <Btn title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}><Quote className="h-3.5 w-3.5" /></Btn>
        <Btn title="Code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}><Code className="h-3.5 w-3.5" /></Btn>
        <Btn title="Link" onClick={setLink} active={editor.isActive('link')}><LinkIcon className="h-3.5 w-3.5" /></Btn>
        <div className="ml-auto flex">
          <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-3.5 w-3.5" /></Btn>
          <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-3.5 w-3.5" /></Btn>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export const NOTE_TEMPLATES: { id: string; label: string; content: string }[] = [
  { id: 'blank', label: 'Blank', content: '' },
  {
    id: 'meeting',
    label: 'Meeting notes',
    content: '<h2>Meeting</h2><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><h3>Agenda</h3><ul><li></li></ul><h3>Decisions</h3><ul><li></li></ul><h3>Action items</h3><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><div></div></li></ul>',
  },
  {
    id: 'daily',
    label: 'Daily journal',
    content: '<h2>Today</h2><h3>Wins</h3><ul><li></li></ul><h3>Challenges</h3><ul><li></li></ul><h3>Tomorrow\'s focus</h3><ul><li></li></ul>',
  },
  {
    id: 'project',
    label: 'Project brief',
    content: '<h2>Project</h2><p><strong>Goal:</strong> </p><p><strong>Deadline:</strong> </p><h3>Scope</h3><ul><li></li></ul><h3>Risks</h3><ul><li></li></ul><h3>Next steps</h3><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><div></div></li></ul>',
  },
];

// Strip HTML for plain text preview
export function htmlToText(html: string) {
  if (typeof window === 'undefined') return html;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
