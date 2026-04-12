import { useState, useEffect } from 'react';
import { getProfile, setProfile } from '@/lib/store';
import { UserProfile, ModuleKey } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Sun, Moon, CheckSquare, Zap, Target, BookOpen, Timer, Bell } from 'lucide-react';
import { toast } from 'sonner';

const moduleList: { key: ModuleKey; label: string; icon: typeof CheckSquare }[] = [
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'habits', label: 'Habits', icon: Zap },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'notes', label: 'Notes', icon: BookOpen },
  { key: 'focus', label: 'Focus', icon: Timer },
];

export default function Settings() {
  const [profile, setLocalProfile] = useState<UserProfile>(
    getProfile() || { name: 'User', email: 'user@example.com', lifestyleMode: 'personal-growth', enabledModules: ['tasks', 'habits', 'goals', 'notes', 'focus'], theme: 'light' }
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', profile.theme === 'dark');
  }, [profile.theme]);

  const update = (changes: Partial<UserProfile>) => {
    const updated = { ...profile, ...changes };
    setLocalProfile(updated);
    setProfile(updated);
  };

  const toggleModule = (key: ModuleKey) => {
    const modules = profile.enabledModules.includes(key) ? profile.enabledModules.filter(m => m !== key) : [...profile.enabledModules, key];
    update({ enabledModules: modules });
  };

  const saveChanges = () => {
    setProfile(profile);
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><User className="h-4 w-4" />Profile</h2>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={profile.name} onChange={e => update({ name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={profile.email} onChange={e => update({ email: e.target.value })} type="email" /></div>
        </div>
      </section>

      {/* Theme */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          {profile.theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          Appearance
        </h2>
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

      {/* Modules */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Module Preferences</h2>
        <div className="space-y-3">
          {moduleList.map(m => (
            <div key={m.key} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <m.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{m.label}</span>
              </div>
              <Switch checked={profile.enabledModules.includes(m.key)} onCheckedChange={() => toggleModule(m.key)} />
            </div>
          ))}
        </div>
      </section>

      {/* Notifications placeholder */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Bell className="h-4 w-4" />Notifications</h2>
        <div className="space-y-3">
          {['Daily reminders', 'Habit streak alerts', 'Goal deadline warnings'].map(n => (
            <div key={n} className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">{n}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Notification delivery coming soon.</p>
      </section>

      <Button onClick={saveChanges} className="gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
        Save Changes
      </Button>
    </div>
  );
}
