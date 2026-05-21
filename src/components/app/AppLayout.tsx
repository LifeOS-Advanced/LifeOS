import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { CommandBar, useCommandBar } from './CommandBar';
import { DailyCheckInModal } from './DailyCheckIn';
import { WeeklyReviewPrompt } from './WeeklyReviewPrompt';
import { QuickCapture } from './QuickCapture';
import { getProfile } from '@/lib/store';
import { generateRecurringInstances } from '@/lib/recurrence';
import { applyThemeFromProfile } from '@/lib/theme';
import { Search } from 'lucide-react';
import { useEffect } from 'react';

export function AppLayout() {
  const profile = getProfile();
  const { open, setOpen } = useCommandBar();
  useEffect(() => { generateRecurringInstances(); applyThemeFromProfile(); }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between border-b border-border px-4 lg:px-6 bg-card/50 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search…</span>
                <kbd className="ml-3 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
              </button>
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                {(profile?.name || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
        <CommandBar open={open} onOpenChange={setOpen} />
        <DailyCheckInModal />
        <WeeklyReviewPrompt />
        <QuickCapture />
      </div>
    </SidebarProvider>
  );
}
