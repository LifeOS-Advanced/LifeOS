/**
 * Global UI state via Zustand. Use for ephemeral cross-component state
 * (modals, command bar, filters) — NOT for server data (use React Query).
 */
import { create } from 'zustand';
import type { LifeArea } from './types';

interface UIState {
  // Command bar
  commandBarOpen: boolean;
  setCommandBarOpen: (open: boolean) => void;

  // Quick-add modals
  quickAddTask: boolean;
  setQuickAddTask: (open: boolean) => void;

  // Global life-area filter (cross-page)
  globalAreaFilter: LifeArea | 'all';
  setGlobalAreaFilter: (area: LifeArea | 'all') => void;

  // Daily check-in modal
  checkInOpen: boolean;
  setCheckInOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandBarOpen: false,
  setCommandBarOpen: (open) => set({ commandBarOpen: open }),

  quickAddTask: false,
  setQuickAddTask: (open) => set({ quickAddTask: open }),

  globalAreaFilter: 'all',
  setGlobalAreaFilter: (area) => set({ globalAreaFilter: area }),

  checkInOpen: false,
  setCheckInOpen: (open) => set({ checkInOpen: open }),
}));
