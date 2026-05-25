import { useState, useEffect, useMemo } from 'react';
import { setProfile } from '@/lib/store';
import { useProfile, useSaveProfile } from '@/lib/queries';
import { applyAccent, ACCENT_OPTIONS } from '@/lib/theme';
import { UserProfile, ModuleKey, DEFAULT_PREFERENCES, DashboardWidgetKey, UserPreferences, AccentTheme } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Sun, Moon, CheckSquare, Zap, Target, BookOpen, Timer, Bell, LayoutDashboard, Globe, Calendar as CalIcon, Palette, Pin, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeader, Chip } from '@/components/app/patterns';

const moduleList: { key: ModuleKey; label: string; icon: typeof CheckSquare }[] = [
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'habits', label: 'Habits', icon: Zap },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'notes', label: 'Notes', icon: BookOpen },
  { key: 'focus', label: 'Focus', icon: Timer },
];

const widgetMeta: Record<DashboardWidgetKey, string> = {
  today: 'Today engine',
  momentum: 'Life momentum',
  habits: 'Habits',
  goals: 'Goals',
  focus: 'Focus stats',
  consistency: 'Consistency',
  insights: 'Insights',
};
const ALL_WIDGETS: DashboardWidgetKey[] = ['today', 'momentum', 'habits', 'goals', 'focus', 'consistency', 'insights'];

const focusPresets = [15, 25, 45, 50, 90];

function getTimezones(): string[] {
  try {
    const supported = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    if (Array.isArray(supported) && supported.length) return supported;
  } catch {
    // Older runtimes may not expose the timezone list.
  }
  return ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney'];
}

function buildInitialProfile(source?: UserProfile | null): UserProfile {
  const initial = source || { name: 'User', email: 'user@example.com', lifestyleMode: 'personal-growth' as const, enabledModules: ['tasks', 'habits', 'goals', 'notes', 'focus'] as ModuleKey[], theme: 'light' as const };
  const initialPreferences = { ...DEFAULT_PREFERENCES, ...(initial.preferences || {}) };
  if (!(initialPreferences.widgetOrder ?? []).includes('momentum')) {
    initialPreferences.dashboardWidgets = [...new Set<DashboardWidgetKey>(['momentum', ...initialPreferences.dashboardWidgets])];
    initialPreferences.widgetOrder = [...new Set<DashboardWidgetKey>(['today', 'momentum', ...(initialPreferences.widgetOrder ?? [])])];
  }
  return { ...initial, preferences: initialPreferences };
}

export default function SettingsPage() {
  const { data: loadedProfile, isLoading } = useProfile();
  const saveProfileMutation = useSaveProfile();
  const [profile, setLocalProfile] = useState<UserProfile>(() => buildInitialProfile());

  useEffect(() => {
    if (loadedProfile) setLocalProfile(buildInitialProfile(loadedProfile));
  }, [loadedProfile]);

  const prefs = profile.preferences!;
  const timezones = useMemo(getTimezones, []);
  const order: DashboardWidgetKey[] = useMemo(() => {
    const o = prefs.widgetOrder ?? DEFAULT_PREFERENCES.widgetOrder!;
    // Ensure all widgets appear once
    const seen = new Set(o);
    return [...o, ...ALL_WIDGETS.filter(w => !seen.has(w))];
  }, [prefs.widgetOrder]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', profile.theme === 'dark');
    applyAccent(prefs.accentTheme);
  }, [profile.theme, prefs.accentTheme]);

  const update = (changes: Partial<UserProfile>) => {
    const updated = { ...profile, ...changes };
    setLocalProfile(updated);
    setProfile(updated);
  };

  const updatePrefs = (changes: Partial<UserPreferences>) => {
    update({ preferences: { ...prefs, ...changes } });
  };

  const toggleModule = (key: ModuleKey) => {
    const modules = profile.enabledModules.includes(key) ? profile.enabledModules.filter(m => m !== key) : [...profile.enabledModules, key];
    update({ enabledModules: modules });
  };

  const togglePinned = (key: ModuleKey) => {
    const cur = prefs.pinnedModules ?? [];
    const next = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key];
    updatePrefs({ pinnedModules: next });
  };

  const toggleWidget = (key: DashboardWidgetKey) => {
    const widgets = prefs.dashboardWidgets.includes(key) ? prefs.dashboardWidgets.filter(w => w !== key) : [...prefs.dashboardWidgets, key];
    updatePrefs({ dashboardWidgets: widgets });
  };

  const moveWidget = (key: DashboardWidgetKey, dir: -1 | 1) => {
    const idx = order.indexOf(key);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= order.length) return;
    const next = [...order];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    updatePrefs({ widgetOrder: next });
  };

  const setAccent = (a: AccentTheme) => {
    updatePrefs({ accentTheme: a });
    applyAccent(a);
  };

  const saveChanges = async () => {
    try {
      const saved = await saveProfileMutation.mutateAsync(profile);
      setProfile(saved);
      toast.success('Settings saved');
    } catch (error) {
      setProfile(profile);
      toast.error(error instanceof Error ? error.message : 'Could not save settings');
    }
  };

  if (isLoading && !loadedProfile) {
    return <div className="max-w-2xl mx-auto h-48 rounded-xl bg-secondary/50 animate-pulse" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account, preferences, and dashboard layout.</p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <SectionHeader icon={User} title="Profile" />
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={profile.name} onChange={e => update({ name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={profile.email} onChange={e => update({ email: e.target.value })} type="email" /></div>
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <SectionHeader icon={profile.theme === 'dark' ? Moon : Sun} title="Appearance" />
        <div className="flex items-center gap-3 mb-5">
          {(['light', 'dark'] as const).map(t => (
            <button
              key={t}
              onClick={() => update({ theme: t })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${profile.theme === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
            >
              {t === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="text-sm font-medium capitalize">{t}</span>
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground"><Palette className="h-4 w-4" /> Accent color</div>
          <div className="grid grid-cols-4 gap-2">
            {ACCENT_OPTIONS.map(opt => {
              const active = (prefs.accentTheme || 'indigo') === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setAccent(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${active ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/30'}`}
                >
                  <span className="h-4 w-4 rounded-full ring-1 ring-border" style={{ background: opt.swatch }} />
                  <span className="text-xs font-medium text-foreground">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Locale & Time */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <SectionHeader icon={Globe} title="Locale & time" description="Used for scheduling, reviews, and reminders." />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Timezone</Label>
            <Select value={prefs.timezone} onValueChange={(v) => updatePrefs({ timezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-64">
                {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Week starts on</Label>
            <Select value={String(prefs.weekStartDay)} onValueChange={(v) => updatePrefs({ weekStartDay: Number(v) as 0 | 1 })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="0">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Focus defaults */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <SectionHeader icon={Timer} title="Focus defaults" description="Default session length when starting a new focus block." />
        <div className="flex flex-wrap gap-2">
          {focusPresets.map(m => (
            <Chip key={m} active={prefs.defaultFocusDuration === m} onClick={() => updatePrefs({ defaultFocusDuration: m })}>
              {m} min
            </Chip>
          ))}
          <div className="flex items-center gap-2 ml-2">
            <Input
              type="number"
              min={5}
              max={180}
              value={prefs.defaultFocusDuration}
              onChange={(e) => updatePrefs({ defaultFocusDuration: Math.max(5, Math.min(180, Number(e.target.value) || 25)) })}
              className="w-20 h-8"
            />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
        </div>
      </section>

      {/* Dashboard customization */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <SectionHeader icon={LayoutDashboard} title="Dashboard widgets" description="Reorder, show or hide widgets on your dashboard." />
        <ul className="space-y-1.5">
          {order.map((key, idx) => {
            const visible = prefs.dashboardWidgets.includes(key);
            return (
              <li key={key} className="flex items-center gap-2 rounded-lg border border-subtle px-3 py-2 bg-card">
                <span className="flex-1 text-sm text-foreground">{widgetMeta[key]}</span>
                <button onClick={() => moveWidget(key, -1)} disabled={idx === 0} className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-secondary disabled:opacity-30">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => moveWidget(key, 1)} disabled={idx === order.length - 1} className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-secondary disabled:opacity-30">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => toggleWidget(key)} className={`h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-secondary ${visible ? 'text-primary' : 'text-muted-foreground'}`} title={visible ? 'Hide' : 'Show'}>
                  {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Modules */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <SectionHeader icon={CalIcon} title="Modules" description="Enable sections and pin favorites to the top of the sidebar." />
        <div className="space-y-2">
          {moduleList.map(m => {
            const enabled = profile.enabledModules.includes(m.key);
            const pinned = (prefs.pinnedModules ?? []).includes(m.key);
            return (
              <div key={m.key} className="flex items-center justify-between py-1.5 gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{m.label}</span>
                </div>
                <button
                  onClick={() => togglePinned(m.key)}
                  disabled={!enabled}
                  className={`h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors ${pinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-secondary'} disabled:opacity-30`}
                  title={pinned ? 'Unpin' : 'Pin to sidebar'}
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <Switch checked={enabled} onCheckedChange={() => toggleModule(m.key)} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <SectionHeader icon={Bell} title="Notifications" />
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-foreground">Daily reminders</span>
            <Switch checked={prefs.notifications.dailyReminders} onCheckedChange={(v) => updatePrefs({ notifications: { ...prefs.notifications, dailyReminders: v } })} />
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-foreground">Habit streak alerts</span>
            <Switch checked={prefs.notifications.habitStreakAlerts} onCheckedChange={(v) => updatePrefs({ notifications: { ...prefs.notifications, habitStreakAlerts: v } })} />
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-foreground">Goal deadline warnings</span>
            <Switch checked={prefs.notifications.goalDeadlineWarnings} onCheckedChange={(v) => updatePrefs({ notifications: { ...prefs.notifications, goalDeadlineWarnings: v } })} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Phase 1 uses in-app banners and prompts. Phase 2 will enable browser push via the service worker and <code className="text-[10px]">/api/notifications</code>.
        </p>
      </section>

      <div className="flex justify-end">
        <Button onClick={saveChanges} className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
          Save changes
        </Button>
      </div>
    </div>
  );
}
