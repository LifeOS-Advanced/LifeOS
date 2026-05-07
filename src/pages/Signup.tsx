import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setAuthenticated, setProfile } from '@/lib/store';
import { dummyTasks, dummyHabits, dummyGoals, dummyNotes, dummyFocusSessions } from '@/lib/dummy-data';
import { setTasks, setHabits, setGoals, setNotes, setFocusSessions } from '@/lib/store';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { signupSchema } from '@/lib/schemas';
import { DEFAULT_PREFERENCES } from '@/lib/types';

type SignupValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = (values: SignupValues) => {
    setAuthenticated(true);
    setProfile({
      name: values.name,
      email: values.email,
      lifestyleMode: 'personal-growth',
      enabledModules: ['tasks', 'habits', 'goals', 'notes', 'focus'],
      theme: 'light',
      preferences: DEFAULT_PREFERENCES,
    });
    setTasks(dummyTasks);
    setHabits(dummyHabits);
    setGoals(dummyGoals);
    setNotes(dummyNotes);
    setFocusSessions(dummyFocusSessions);
    navigate('/onboarding');
  };

  const oauth = () => onSubmit({ name: 'New User', email: 'demo@lifeos.app', password: 'demopassword' });

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">L</div>
            <span className="text-lg font-bold text-foreground">LifeOS</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-muted-foreground mb-8">Start organizing your life in minutes.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" placeholder="John Doe" className="pl-10" aria-invalid={!!errors.name} {...register('name')} />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10" aria-invalid={!!errors.email} {...register('email')} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="At least 8 characters" className="pl-10" aria-invalid={!!errors.password} {...register('password')} />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full gradient-primary text-primary-foreground font-semibold h-11 shadow-glow hover:opacity-90 transition-opacity">
              Create account
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="h-11" onClick={oauth}>Google</Button>
            <Button type="button" variant="outline" className="h-11" onClick={oauth}>GitHub</Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
