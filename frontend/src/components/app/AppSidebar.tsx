import { LayoutDashboard, CheckSquare, Zap, Target, BookOpen, Timer, Settings, LogOut, Sparkles, CalendarDays, LineChart, Pin, Sunrise, Moon, Trophy, ShieldCheck } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useProfile } from '@/lib/queries';
import { useAuth } from '@/context/AuthContext';
import { ModuleKey } from '@/lib/types';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const moduleItems: Record<ModuleKey, { title: string; url: string; icon: typeof CheckSquare }> = {
  tasks: { title: 'Tasks',  url: '/app/tasks',  icon: CheckSquare },
  habits: { title: 'Habits', url: '/app/habits', icon: Zap },
  goals: { title: 'Goals',  url: '/app/goals',  icon: Target },
  notes: { title: 'Notes',  url: '/app/notes',  icon: BookOpen },
  focus: { title: 'Focus',  url: '/app/focus',  icon: Timer },
  discipline: { title: 'Discipline', url: '/app/discipline', icon: ShieldCheck },
};

const dashboardItem = { title: 'Dashboard',     url: '/app',             icon: LayoutDashboard };
const calendarItem  = { title: 'Calendar',       url: '/app/calendar',    icon: CalendarDays };
const insightsItem  = { title: 'Insights',       url: '/app/insights',    icon: LineChart };
const progressItem  = { title: 'Progress',       url: '/app/progress',    icon: Trophy };
const reviewItem    = { title: 'Weekly Review',  url: '/app/review',      icon: Sparkles };
const dailyStartItem = { title: 'Daily Start', url: '/app/daily-start', icon: Sunrise };
const shutdownItem = { title: 'Shutdown', url: '/app/evening-shutdown', icon: Moon };

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location  = useLocation();
  const { data: profile } = useProfile();
  const { logout } = useAuth();

  const enabled    = profile?.enabledModules ?? (['tasks', 'habits', 'goals', 'notes', 'focus', 'discipline'] as ModuleKey[]);
  const pinned     = (profile?.preferences?.pinnedModules ?? []).filter(k => enabled.includes(k));
  const moduleNav  = enabled.filter(k => !pinned.includes(k)).map(k => moduleItems[k]).filter(Boolean);
  const pinnedNav  = pinned.map(k => moduleItems[k]).filter(Boolean);
  const utilityNav = [progressItem, dailyStartItem, shutdownItem, calendarItem, insightsItem, reviewItem];

  const isActive = (path: string) => {
    if (path === '/app') return location.pathname === '/app';
    return location.pathname.startsWith(path);
  };

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
      active
        ? 'bg-white/10 text-white'
        : 'text-sidebar-foreground/60 hover:bg-white/6 hover:text-sidebar-foreground'
    }`;

  const renderItem = (item: { title: string; url: string; icon: typeof CheckSquare }, showPin?: boolean) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.url === '/app'}
          className={navItemClass(isActive(item.url))}
          activeClassName="bg-white/10 text-white"
        >
          <item.icon className={`h-4 w-4 shrink-0 ${isActive(item.url) ? 'opacity-100' : 'opacity-60'}`} />
          {!collapsed && (
            <>
              <span className="flex-1">{item.title}</span>
              {showPin && <Pin className="h-3 w-3 opacity-40" />}
            </>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border/50">
        <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-glow">L</div>
        {!collapsed && (
          <span className="text-base font-semibold text-sidebar-foreground ml-2.5 tracking-tight">LifeOS</span>
        )}
      </div>

      <SidebarContent className="px-2 py-3">
        {/* Pinned */}
        {pinnedNav.length > 0 && (
          <SidebarGroup className="pb-1">
            {!collapsed && (
              <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.12em] text-sidebar-foreground/35 px-3 py-1.5">
                Pinned
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {pinnedNav.map(item => renderItem(item, true))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Main nav */}
        <SidebarGroup className="pb-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {renderItem(dashboardItem)}
              {moduleNav.map(item => renderItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        {!collapsed && <div className="mx-3 my-1 border-t border-sidebar-border/30" />}

        {/* Workspace */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.12em] text-sidebar-foreground/35 px-3 py-1.5">
              Workspace
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {utilityNav.map(item => renderItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-3 border-t border-sidebar-border/30 pt-3">
        {/* User profile mini */}
        {!collapsed && profile && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1.5 rounded-lg bg-white/5">
            <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {(profile.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{profile.name}</p>
              <p className="text-[10px] text-sidebar-foreground/40 truncate capitalize">{profile.lifestyleMode?.replace('-', ' ')}</p>
            </div>
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/app/settings"
                className={navItemClass(isActive('/app/settings'))}
                activeClassName="bg-white/10 text-white"
              >
                <Settings className="h-4 w-4 shrink-0 opacity-60" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/50 hover:bg-destructive/15 hover:text-red-400 transition-all duration-150 cursor-pointer w-full"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Log out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
