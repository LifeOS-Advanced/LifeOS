import { getTasks, getHabits, getGoals, getNotes } from './store';

export type SearchResultType = 'task' | 'habit' | 'goal' | 'note';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  snippet?: string;
  route: string;
}

export function searchAll(query: string): Record<SearchResultType, SearchResult[]> {
  const q = query.trim().toLowerCase();
  const empty = { task: [], habit: [], goal: [], note: [] } as Record<SearchResultType, SearchResult[]>;
  if (!q) return empty;

  const match = (s?: string) => !!s && s.toLowerCase().includes(q);

  return {
    task: getTasks()
      .filter(t => match(t.title) || match(t.description) || t.tags.some(tag => match(tag)))
      .slice(0, 5)
      .map(t => ({ id: t.id, type: 'task', title: t.title, snippet: t.description, route: '/app/tasks' })),
    habit: getHabits()
      .filter(h => match(h.title) || match(h.description))
      .slice(0, 5)
      .map(h => ({ id: h.id, type: 'habit', title: h.title, snippet: h.description, route: '/app/habits' })),
    goal: getGoals()
      .filter(g => match(g.title) || match(g.description))
      .slice(0, 5)
      .map(g => ({ id: g.id, type: 'goal', title: g.title, snippet: g.description, route: '/app/goals' })),
    note: getNotes()
      .filter(n => match(n.title) || match(n.content) || n.tags.some(tag => match(tag)))
      .slice(0, 5)
      .map(n => ({ id: n.id, type: 'note', title: n.title, snippet: n.content.slice(0, 80), route: '/app/notes' })),
  };
}
