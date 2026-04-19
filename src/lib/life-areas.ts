import { Briefcase, GraduationCap, Heart, DollarSign, User, Users, Sparkles, FolderKanban, LucideIcon } from 'lucide-react';
import { LifeArea } from './types';

export interface LifeAreaMeta {
  id: LifeArea;
  label: string;
  icon: LucideIcon;
  /** Tailwind text color class using semantic token */
  color: string;
  /** Tailwind bg tint class */
  bg: string;
}

export const LIFE_AREAS: LifeAreaMeta[] = [
  { id: 'work',     label: 'Work',     icon: Briefcase,     color: 'text-primary',     bg: 'bg-primary/10' },
  { id: 'study',    label: 'Study',    icon: GraduationCap, color: 'text-info',        bg: 'bg-info/10' },
  { id: 'health',   label: 'Health',   icon: Heart,         color: 'text-success',     bg: 'bg-success/10' },
  { id: 'money',    label: 'Money',    icon: DollarSign,    color: 'text-warning',     bg: 'bg-warning/10' },
  { id: 'personal', label: 'Personal', icon: User,          color: 'text-accent',      bg: 'bg-accent/10' },
  { id: 'family',   label: 'Family',   icon: Users,         color: 'text-destructive', bg: 'bg-destructive/10' },
  { id: 'faith',    label: 'Faith',    icon: Sparkles,      color: 'text-primary',     bg: 'bg-primary/10' },
  { id: 'projects', label: 'Projects', icon: FolderKanban,  color: 'text-accent',      bg: 'bg-accent/10' },
];

export const getLifeArea = (id?: LifeArea | null): LifeAreaMeta | undefined =>
  id ? LIFE_AREAS.find(a => a.id === id) : undefined;
