import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { setOnboarded, getProfile, setProfile } from '@/lib/store';
import { LifestyleMode, ModuleKey } from '@/lib/types';
import { GraduationCap, Briefcase, Building2, Palette, Heart, CheckSquare, Zap, Target, BookOpen, Timer, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const lifestyles: { mode: LifestyleMode; label: string; desc: string; icon: typeof GraduationCap }[] = [
  { mode: 'student', label: 'Student', desc: 'Manage coursework, exams, and study habits', icon: GraduationCap },
  { mode: 'freelancer', label: 'Freelancer', desc: 'Track projects, clients, and work-life balance', icon: Briefcase },
  { mode: 'employee', label: 'Employee', desc: 'Organize work tasks, growth goals, and routines', icon: Building2 },
  { mode: 'creator', label: 'Creator', desc: 'Plan content, track creative goals, and stay focused', icon: Palette },
  { mode: 'personal-growth', label: 'Personal Growth', desc: 'Build habits, set goals, and improve yourself', icon: Heart },
];

const modules: { key: ModuleKey; label: string; desc: string; icon: typeof CheckSquare }[] = [
  { key: 'tasks', label: 'Tasks', desc: 'Organize and prioritize your to-dos', icon: CheckSquare },
  { key: 'habits', label: 'Habits', desc: 'Build consistency with daily tracking', icon: Zap },
  { key: 'goals', label: 'Goals', desc: 'Set targets with milestones and progress', icon: Target },
  { key: 'notes', label: 'Notes', desc: 'Capture ideas and knowledge', icon: BookOpen },
  { key: 'focus', label: 'Focus', desc: 'Deep work with pomodoro timer', icon: Timer },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedMode, setSelectedMode] = useState<LifestyleMode>('personal-growth');
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(['tasks', 'habits', 'goals', 'notes', 'focus']);

  const toggleModule = (key: ModuleKey) => {
    setSelectedModules(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
  };

  const finish = () => {
    const profile = getProfile();
    setProfile({
      name: profile?.name || 'User',
      email: profile?.email || 'user@example.com',
      lifestyleMode: selectedMode,
      enabledModules: selectedModules,
      theme: 'light',
    });
    setOnboarded(true);
    navigate('/app');
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">L</div>
            <span className="text-lg font-bold text-foreground">LifeOS</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            {[0, 1].map(i => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 gradient-primary' : 'w-2 bg-border'}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
                <h1 className="text-2xl font-bold text-foreground mb-2">What describes you best?</h1>
                <p className="text-muted-foreground mb-8">This helps us personalize your experience.</p>

                <div className="space-y-3">
                  {lifestyles.map(l => (
                    <button
                      key={l.mode}
                      onClick={() => setSelectedMode(l.mode)}
                      className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-card ${selectedMode === l.mode ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-card hover:border-primary/30'}`}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selectedMode === l.mode ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                        <l.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{l.label}</p>
                        <p className="text-sm text-muted-foreground">{l.desc}</p>
                      </div>
                      {selectedMode === l.mode && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  ))}
                </div>

                <Button onClick={() => setStep(1)} className="w-full mt-6 gradient-primary text-primary-foreground font-semibold h-11 shadow-glow hover:opacity-90 transition-opacity">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
                <h1 className="text-2xl font-bold text-foreground mb-2">Choose your modules</h1>
                <p className="text-muted-foreground mb-8">Select the tools you want in your workspace. You can change this later.</p>

                <div className="space-y-3">
                  {modules.map(m => (
                    <button
                      key={m.key}
                      onClick={() => toggleModule(m.key)}
                      className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-card ${selectedModules.includes(m.key) ? 'border-primary bg-primary/5 shadow-card' : 'border-border bg-card hover:border-primary/30'}`}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selectedModules.includes(m.key) ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                        <m.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{m.label}</p>
                        <p className="text-sm text-muted-foreground">{m.desc}</p>
                      </div>
                      {selectedModules.includes(m.key) && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-11">Back</Button>
                  <Button onClick={finish} className="flex-1 gradient-primary text-primary-foreground font-semibold h-11 shadow-glow hover:opacity-90 transition-opacity" disabled={selectedModules.length === 0}>
                    Launch LifeOS
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
