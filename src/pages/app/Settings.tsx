import { useState, useEffect, useMemo } from 'react';
import { getProfile, setProfile } from '@/lib/store';
import { UserProfile, ModuleKey, DEFAULT_PREFERENCES, DashboardWidgetKey, UserPreferences } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Sun, Moon, CheckSquare, Zap, Target, BookOpen, Timer, Bell, LayoutDashboard, Globe, Calendar as CalIcon } from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeader, Chip } from '@/components/app/patterns';

const moduleList: { key: ModuleKey; label: string; icon: typeof CheckSquare }[] = [
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'habits', label: 'Habits', icon: Zap },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'notes', label: 'Notes', icon: BookOpen },
  { key: 'focus', label: 'Focus', icon: Timer },
];

const widgetList: { key: DashboardWidgetKey; label: string }[] = [
  { key: 'today', label: 'Today engine' },
  { key: 'habits', label: 'Habits' },
  { key: 'goals', label: 'Goals' },
  { key: 'focus', label: 'Focus stats' },
  { key: 'consistency', label: 'Consistency' },
  { key: 'insights', label: 'Insights' },
];

const focusPresets = [15, 25, 45, 50, 90];

function getTimezones(): string[] {
  try {
    // @ts-ignore
    const supported = Intl.supportedValuesOf?.('timeZone');
    if (Array.isArray(supported) && supported.length) return supported;
  } catch {}
  return ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney'];
}

export default function Settings() {
  const initial = getProfile() || { name: 'User', email: 'user@example.com', lifestyleMode: 'personal-growth' as const, enabledModules: ['tasks', 'habits', 'goals', 'notes', 'focus'] as ModuleKey[], theme: 'light' as const };
  const [profile, setLocalProfile] = useState<UserProfile>({
    ...initial,
    preferences: { ...DEFAULT_PREFERENCES, ...(initial.preferences || {}) },
  });

  const prefs = profile.preferences!;
  const timezones = useMemo(getTimezones, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', profile.theme === 'dark');
  }, [profile.theme]);

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

  const toggleWidget = (key: DashboardWidgetKey) => {
    const widgets = prefs.dashboardWidgets.includes(key) ? prefs.dashboardWidgets.filter(w => w !== key) : [...prefs.dashboardWidgets, key];
    updatePrefs({ dashboardWidgets: widgets });
  };

  const saveChanges = () => {
    setProfile(profile);
    toast.success('Settings saved');
  };

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
        <div className="flex items-center gap-3">
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

      {/* Dashboard widgets */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <SectionHeader icon={LayoutDashboard} title="Dashboard widgets" description="Choose what shows on your dashboard." />
        <div className="space-y-2">
          {widgetList.map(w => (
            <div key={w.key} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground">{w.label}</span>
              <Switch checked={prefs.dashboardWidgets.includes(w.key)} onCheckedChange={() => toggleWidget(w.key)} />
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <SectionHeader icon={CalIcon} title="Modules" description="Enable or disable major sections." />
        <div className="space-y-2">
          {moduleList.map(m => (
            <div key={m.key} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-3">
                <m.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{m.label}</span>
              </div>
              <Switch checked={profile.enabledModules.includes(m.key)} onCheckedChange={() => toggleModule(m.key)} />
            </div>
          ))}
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
        <p className="text-xs text-muted-foreground mt-3">Notification delivery coming soon.</p>
      </section>

      <div className="flex justify-end">
        <Button onClick={saveChanges} className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
          Save changes
        </Button>
      </div>
    </div>
  );
}
