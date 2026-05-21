import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckSquare, BookOpen, Zap, Target, Timer, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIONS = [
  { key: 'task', label: 'Quick task', icon: CheckSquare, route: '/app/tasks?new=1', hint: 'T' },
  { key: 'note', label: 'Quick note', icon: BookOpen, route: '/app/notes?new=1', hint: 'N' },
  { key: 'habit', label: 'Log habit', icon: Zap, route: '/app/habits?new=1', hint: 'H' },
  { key: 'goal', label: 'Goal idea', icon: Target, route: '/app/goals?new=1', hint: 'G' },
  { key: 'focus', label: 'Start focus', icon: Timer, route: '/app/focus', hint: 'F' },
];

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      // Shift+A toggles capture
      if (e.shiftKey && (e.key === 'A' || e.key === 'a') && !isTyping(e)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const trigger = (route: string) => {
    setOpen(false);
    setTimeout(() => navigate(route), 0);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {open && ACTIONS.map((a, i) => (
            <motion.button
              key={a.key}
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.03 } }}
              exit={{ opacity: 0, y: 12, scale: 0.9, transition: { duration: 0.12 } }}
              onClick={() => trigger(a.route)}
              className="flex items-center gap-2 rounded-full bg-card border border-border shadow-lg pl-3 pr-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-secondary transition-colors"
            >
              <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <a.icon className="h-3.5 w-3.5" />
              </span>
              <span>{a.label}</span>
              <kbd className="ml-2 text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{a.hint}</kbd>
            </motion.button>
          ))}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close quick capture' : 'Open quick capture'}
          className={cn(
            'h-14 w-14 rounded-full gradient-primary text-primary-foreground shadow-glow flex items-center justify-center transition-transform',
            open && 'rotate-45',
          )}
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.button>
      </div>
    </>
  );
}

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable;
}
