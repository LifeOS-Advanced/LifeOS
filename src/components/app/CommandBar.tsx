import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  CheckSquare, Zap, Target, BookOpen, Timer, LayoutDashboard, Settings,
  Plus, Sun, Moon, Search, Sparkles,
} from 'lucide-react';
import { searchAll, SearchResult } from '@/lib/search';
import { getProfile, setProfile } from '@/lib/store';

interface CommandBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandBar({ open, onOpenChange }: CommandBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    setTimeout(fn, 0);
  };

  const goCreate = (route: string) => run(() => navigate(`${route}?new=1`));
  const go = (route: string) => run(() => navigate(route));

  const toggleTheme = () => {
    const p = getProfile();
    if (!p) return;
    const next = p.theme === 'dark' ? 'light' : 'dark';
    setProfile({ ...p, theme: next });
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const results = searchAll(query);
  const hasResults = (['task', 'habit', 'goal', 'note'] as const).some(k => results[k].length > 0);

  const renderGroup = (label: string, items: SearchResult[], Icon: typeof CheckSquare) => {
    if (items.length === 0) return null;
    return (
      <CommandGroup heading={label}>
        {items.map(r => (
          <CommandItem key={`${r.type}-${r.id}`} value={`${r.type}-${r.id}-${r.title}`} onSelect={() => go(r.route)}>
            <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="truncate">{r.title}</div>
              {r.snippet && <div className="text-xs text-muted-foreground truncate">{r.snippet}</div>}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search or jump to…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {query && hasResults && (
          <>
            {renderGroup('Tasks', results.task, CheckSquare)}
            {renderGroup('Notes', results.note, BookOpen)}
            {renderGroup('Goals', results.goal, Target)}
            {renderGroup('Habits', results.habit, Zap)}
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => goCreate('/app/tasks')}>
            <Plus className="mr-2 h-4 w-4" />New task
            <CommandShortcut>T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goCreate('/app/notes')}>
            <Plus className="mr-2 h-4 w-4" />New note
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goCreate('/app/goals')}>
            <Plus className="mr-2 h-4 w-4" />New goal
          </CommandItem>
          <CommandItem onSelect={() => goCreate('/app/habits')}>
            <Plus className="mr-2 h-4 w-4" />New habit
          </CommandItem>
          <CommandItem onSelect={() => go('/app/focus')}>
            <Timer className="mr-2 h-4 w-4" />Start focus session
          </CommandItem>
          <CommandItem onSelect={() => go('/app/review')}>
            <Sparkles className="mr-2 h-4 w-4" />Open weekly review
          </CommandItem>
          <CommandItem onSelect={() => run(toggleTheme)}>
            <Sun className="mr-2 h-4 w-4 dark:hidden" />
            <Moon className="mr-2 h-4 w-4 hidden dark:inline" />
            Toggle theme
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go('/app')}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</CommandItem>
          <CommandItem onSelect={() => go('/app/tasks')}><CheckSquare className="mr-2 h-4 w-4" />Tasks</CommandItem>
          <CommandItem onSelect={() => go('/app/habits')}><Zap className="mr-2 h-4 w-4" />Habits</CommandItem>
          <CommandItem onSelect={() => go('/app/goals')}><Target className="mr-2 h-4 w-4" />Goals</CommandItem>
          <CommandItem onSelect={() => go('/app/notes')}><BookOpen className="mr-2 h-4 w-4" />Notes</CommandItem>
          <CommandItem onSelect={() => go('/app/focus')}><Timer className="mr-2 h-4 w-4" />Focus</CommandItem>
          <CommandItem onSelect={() => go('/app/review')}><Sparkles className="mr-2 h-4 w-4" />Weekly review</CommandItem>
          <CommandItem onSelect={() => go('/app/settings')}><Settings className="mr-2 h-4 w-4" />Settings</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandBar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return { open, setOpen };
}
