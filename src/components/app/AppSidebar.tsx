import { LayoutDashboard, CheckSquare, Zap, Target, BookOpen, Timer, Settings, LogOut, Sparkles, CalendarDays, LineChart, Pin } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { setAuthenticated, getProfile } from '@/lib/store';
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
  tasks: { title: 'Tasks', url: '/app/tasks', icon: CheckSquare },
  habits: { title: 'Habits', url: '/app/habits', icon: Zap },
  goals: { title: 'Goals', url: '/app/goals', icon: Target },
  notes: { title: 'Notes', url: '/app/notes', icon: BookOpen },
  focus: { title: 'Focus', url: '/app/focus', icon: Timer },
};

const dashboardItem = { title: 'Dashboard', url: '/app', icon: LayoutDashboard };
const calendarItem = { title: 'Calendar', url: '/app/calendar', icon: CalendarDays };
const insightsItem = { title: 'Insights', url: '/app/insights', icon: LineChart };
const reviewItem = { title: 'Weekly Review', url: '/app/review', icon: Sparkles };

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const profile = getProfile();
  const enabled = profile?.enabledModules ?? (['tasks', 'habits', 'goals', 'notes', 'focus'] as ModuleKey[]);
  const pinned = (profile?.preferences?.pinnedModules ?? []).filter(k => enabled.includes(k));
  const moduleNav = enabled.filter(k => !pinned.includes(k)).map(k => moduleItems[k]).filter(Boolean);
  const pinnedNav = pinned.map(k => moduleItems[k]).filter(Boolean);
  const utilityNav = [calendarItem, insightsItem, reviewItem];

  const isActive = (path: string) => {
    if (path === '/app') return location.pathname === '/app';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    navigate('/');
  };

  const renderItem = (item: { title: string; url: string; icon: typeof CheckSquare }, pinned?: boolean) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.url === '/app'}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive(item.url) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
          activeClassName="bg-primary/10 text-primary"
        >
          <item.icon className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span className="flex-1">{item.title}</span>}
          {!collapsed && pinned && <Pin className="h-3 w-3 text-muted-foreground/60" />}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">L</div>
        {!collapsed && <span className="text-lg font-bold text-foreground ml-3">LifeOS</span>}
      </div>

      <SidebarContent className="px-2 py-4">
        {pinnedNav.length > 0 && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider">Pinned</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {pinnedNav.map(item => renderItem(item, true))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderItem(dashboardItem)}
              {moduleNav.map(item => renderItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-wider">Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {utilityNav.map(item => renderItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/app/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
                activeClassName="bg-primary/10 text-primary"
              >
                <Settings className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 cursor-pointer">
              <LogOut className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span>Log out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
