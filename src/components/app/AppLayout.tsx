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
import { Search, Bell } from 'lucide-react';
import { useEffect } from 'react';

export function AppLayout() {
  const profile = getProfile();
  const { open, setOpen } = useCommandBar();
  useEffect(() => { generateRecurringInstances(); applyThemeFromProfile(); }, []);

  const initials = (profile?.name || 'U')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 flex items-center justify-between border-b border-border px-4 lg:px-6 bg-card/60 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" />
            </div>

            <div className="flex items-center gap-2">
              {/* Search trigger */}
              <button
                onClick={() => setOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary transition-all"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search…</span>
                <kbd className="ml-3 rounded-md bg-card border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
              </button>

              {/* Mobile search */}
              <button
                onClick={() => setOpen(true)}
                className="sm:hidden h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Notification bell */}
              <button className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative">
                <Bell className="h-4 w-4" />
              </button>

              {/* Avatar */}
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                {initials}
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6 lg:pt-5">
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