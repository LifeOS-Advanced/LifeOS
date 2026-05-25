import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { setOnboarded, getProfile, setProfile } from '@/lib/store';
import { markFirstWeekStarted } from '@/lib/daily-loop';
import { defaultFirstHabitTitle, setPendingFirstHabit, setPendingFirstVisitGuide } from '@/lib/first-win';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LifestyleMode, ModuleKey, ImprovementArea, DayIntensity } from '@/lib/types';
import {
  GraduationCap, Briefcase, Building2, Palette, Heart,
  CheckSquare, Zap, Target, BookOpen, Timer,
  ArrowRight, Check, Brain, DollarSign, Activity, Sparkles, Flame, BookMarked,
  Coffee, Sun, Rocket,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const lifestyles: { mode: LifestyleMode; label: string; desc: string; icon: typeof GraduationCap }[] = [
  { mode: 'student', label: 'Student', desc: 'Manage coursework, exams, and study habits', icon: GraduationCap },
  { mode: 'freelancer', label: 'Freelancer', desc: 'Track projects, clients, and work-life balance', icon: Briefcase },
  { mode: 'employee', label: 'Employee', desc: 'Organize work tasks, growth goals, and routines', icon: Building2 },
  { mode: 'creator', label: 'Creator', desc: 'Plan content, track creative goals, and stay focused', icon: Palette },
  { mode: 'personal-growth', label: 'Personal Growth', desc: 'Build habits, set goals, and improve yourself', icon: Heart },
];

const improvements: { key: ImprovementArea; label: string; icon: typeof Brain }[] = [
  { key: 'discipline', label: 'Discipline', icon: Flame },
  { key: 'studying', label: 'Studying', icon: BookMarked },
  { key: 'productivity', label: 'Productivity', icon: Sparkles },
  { key: 'health', label: 'Health', icon: Activity },
  { key: 'money', label: 'Money', icon: DollarSign },
  { key: 'focus', label: 'Focus', icon: Brain },
];

const intensities: { key: DayIntensity; label: string; desc: string; icon: typeof Coffee }[] = [
  { key: 'light', label: 'Light', desc: 'A few things on my plate', icon: Coffee },
  { key: 'moderate', label: 'Moderate', desc: 'Balanced and steady', icon: Sun },
  { key: 'intense', label: 'Intense', desc: 'Back-to-back, high pace', icon: Rocket },
];

const modules: { key: ModuleKey; label: string; desc: string; icon: typeof CheckSquare }[] = [
  { key: 'tasks', label: 'Tasks', desc: 'Organize and prioritize your to-dos', icon: CheckSquare },
  { key: 'habits', label: 'Habits', desc: 'Build consistency with daily tracking', icon: Zap },
  { key: 'goals', label: 'Goals', desc: 'Set targets with milestones and progress', icon: Target },
  { key: 'notes', label: 'Notes', desc: 'Capture ideas and knowledge', icon: BookOpen },
  { key: 'focus', label: 'Focus', desc: 'Deep work with pomodoro timer', icon: Timer },
];

const TOTAL_STEPS = 6;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedMode, setSelectedMode] = useState<LifestyleMode>('personal-growth');
  const [selectedImprovements, setSelectedImprovements] = useState<ImprovementArea[]>([]);
  const [intensity, setIntensity] = useState<DayIntensity>('moderate');
  const [priority, setPriority] = useState<ModuleKey>('tasks');
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(['tasks', 'habits', 'goals', 'notes', 'focus']);
  const [firstHabitTitle, setFirstHabitTitle] = useState('');

  const toggleModule = (key: ModuleKey) => {
    setSelectedModules(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
  };

  const toggleImprovement = (key: ImprovementArea) => {
    setSelectedImprovements(prev => prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]);
  };

  const finish = () => {
    const profile = getProfile();
    // Reorder enabled modules so priority comes first
    const ordered = [priority, ...selectedModules.filter(m => m !== priority)].filter(m => selectedModules.includes(m));
    setProfile({
      name: profile?.name || 'User',
      email: profile?.email || 'user@example.com',
      lifestyleMode: selectedMode,
      enabledModules: ordered,
      theme: profile?.theme || 'light',
      improvementFocus: selectedImprovements,
      dayIntensity: intensity,
      dashboardPriority: priority,
    });
    setOnboarded(true);
    markFirstWeekStarted();
    const habitTitle = firstHabitTitle.trim() || defaultFirstHabitTitle(selectedImprovements);
    setPendingFirstHabit(habitTitle);
    setPendingFirstVisitGuide();
    navigate('/app');
  };

  const next = () => setStep(s => Math.min(TOTAL_STEPS - 1, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">L</div>
            <span className="text-lg font-bold text-foreground">LifeOS</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 gradient-primary' : 'w-2 bg-border'}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepCard key="s0">
              <h1 className="text-2xl font-bold text-foreground mb-2">What describes you best?</h1>
              <p className="text-muted-foreground mb-8">This helps us personalize your experience.</p>
              <div className="space-y-3">
                {lifestyles.map(l => (
                  <SelectRow key={l.mode} active={selectedMode === l.mode} onClick={() => setSelectedMode(l.mode)} icon={l.icon} title={l.label} desc={l.desc} />
                ))}
              </div>
              <Button onClick={next} className="w-full mt-6 gradient-primary text-primary-foreground font-semibold h-11 shadow-glow hover:opacity-90">
                Continue<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </StepCard>
          )}

          {step === 1 && (
            <StepCard key="s1">
              <h1 className="text-2xl font-bold text-foreground mb-2">What are you trying to improve?</h1>
              <p className="text-muted-foreground mb-8">Pick one or more — we'll tailor your starter setup.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {improvements.map(i => {
                  const active = selectedImprovements.includes(i.key);
                  return (
                    <button
                      key={i.key}
                      onClick={() => toggleImprovement(i.key)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all duration-200 ${active ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-card hover:border-primary/30'}`}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${active ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                        <i.icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{i.label}</span>
                    </button>
                  );
                })}
              </div>
              <NavButtons onBack={back} onNext={next} />
            </StepCard>
          )}

          {step === 2 && (
            <StepCard key="s2">
              <h1 className="text-2xl font-bold text-foreground mb-2">How busy are your days?</h1>
              <p className="text-muted-foreground mb-8">We'll set defaults that match your pace.</p>
              <div className="space-y-3">
                {intensities.map(i => (
                  <SelectRow key={i.key} active={intensity === i.key} onClick={() => setIntensity(i.key)} icon={i.icon} title={i.label} desc={i.desc} />
                ))}
              </div>
              <NavButtons onBack={back} onNext={next} />
            </StepCard>
          )}

          {step === 3 && (
            <StepCard key="s3">
              <h1 className="text-2xl font-bold text-foreground mb-2">What do you want to see first?</h1>
              <p className="text-muted-foreground mb-8">Your dashboard will lead with this.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {modules.map(m => {
                  const active = priority === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setPriority(m.key)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all duration-200 ${active ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-card hover:border-primary/30'}`}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${active ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                        <m.icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{m.label}</span>
                    </button>
                  );
                })}
              </div>
              <NavButtons onBack={back} onNext={next} />
            </StepCard>
          )}

          {step === 4 && (
            <StepCard key="s4-habit">
              <h1 className="text-2xl font-bold text-foreground mb-2">Name one habit to start</h1>
              <p className="text-muted-foreground mb-6">You&apos;ll check it off for your first XP — no goals or long setup.</p>
              <div className="space-y-2">
                <Label htmlFor="first-habit">Daily habit</Label>
                <Input
                  id="first-habit"
                  value={firstHabitTitle}
                  onChange={e => setFirstHabitTitle(e.target.value)}
                  placeholder={defaultFirstHabitTitle(selectedImprovements)}
                  className="h-11"
                />
              </div>
              <NavButtons onBack={back} onNext={next} />
            </StepCard>
          )}

          {step === 5 && (
            <StepCard key="s4">
              <h1 className="text-2xl font-bold text-foreground mb-2">Choose your modules</h1>
              <p className="text-muted-foreground mb-8">Select the tools you want in your workspace. You can change this later.</p>
              <div className="space-y-3">
                {modules.map(m => (
                  <SelectRow
                    key={m.key}
                    active={selectedModules.includes(m.key)}
                    onClick={() => toggleModule(m.key)}
                    icon={m.icon}
                    title={m.label}
                    desc={m.desc}
                  />
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={back} className="flex-1 h-11">Back</Button>
                <Button onClick={finish} className="flex-1 gradient-primary text-primary-foreground font-semibold h-11 shadow-glow hover:opacity-90" disabled={selectedModules.length === 0}>
                  Launch LifeOS<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </StepCard>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">{children}</div>
    </motion.div>
  );
}

function SelectRow({ active, onClick, icon: Icon, title, desc }: { active: boolean; onClick: () => void; icon: typeof Heart; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-card ${active ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-card hover:border-primary/30'}`}
    >
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${active ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      {active && <Check className="h-5 w-5 text-primary shrink-0" />}
    </button>
  );
}

function NavButtons({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex gap-3 mt-6">
      <Button variant="outline" onClick={onBack} className="flex-1 h-11">Back</Button>
      <Button onClick={onNext} className="flex-1 gradient-primary text-primary-foreground font-semibold h-11 shadow-glow hover:opacity-90">
        Continue<ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
