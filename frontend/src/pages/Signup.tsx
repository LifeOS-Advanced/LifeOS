import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
import { signupSchema } from '@/lib/schemas';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type SignupValues = z.infer<typeof signupSchema>;

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const features = [
  'Tasks, habits, goals & notes in one place',
  'Smart daily planning & weekly reviews',
  'Pomodoro focus sessions with analytics',
  'Works offline — your data stays private',
];

export default function Signup() {
  const { register: registerAccount, loginWithGoogle } = useAuth();
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: SignupValues) => {
    try {
      await registerAccount(values.name, values.email, values.password);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create account');
    }
  };

  const googleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await loginWithGoogle(tokenResponse.access_token);
      } catch {
        toast.error('Could not sign up with Google');
      } finally {
        setOauthLoading(null);
      }
    },
    onError: () => setOauthLoading(null),
  });

  const handleGitHub = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) {
      setOauthLoading(null);
      toast.error('GitHub signup is not configured yet');
      return;
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/auth/github/callback`,
      scope: 'read:user user:email',
      state: crypto.randomUUID(),
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Right — form (order reversed vs login) */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-background order-2 lg:order-1">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-sm w-full mx-auto"
        >
          <Link to="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs mb-10 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1 lg:hidden">
              <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">L</span>
              </div>
              <span className="font-semibold text-foreground">LifeOS</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground mt-2">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Free forever. No credit card needed.</p>
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            <button
              type="button"
              onClick={() => { setOauthLoading('google'); googleSignup(); }}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <span className="h-4 w-4 rounded-full border-2 border-border border-t-foreground animate-spin" />
              ) : <GoogleIcon />}
              Google
            </button>
            <button
              type="button"
              onClick={() => { setOauthLoading('github'); handleGitHub(); }}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {oauthLoading === 'github' ? (
                <span className="h-4 w-4 rounded-full border-2 border-border border-t-foreground animate-spin" />
              ) : <GitHubIcon />}
              GitHub
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-[11px] text-muted-foreground uppercase tracking-wider">or with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input id="name" placeholder="Alex Johnson" className="pl-9 h-10 text-sm" aria-invalid={!!errors.name} {...register('name')} />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-9 h-10 text-sm" aria-invalid={!!errors.email} {...register('email')} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input id="password" type="password" placeholder="At least 8 characters" className="pl-9 h-10 text-sm" aria-invalid={!!errors.password} {...register('password')} />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 gradient-primary text-white font-medium shadow-glow hover:opacity-90 transition-opacity"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>Get started for free <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground mt-5 leading-relaxed">
            By continuing you agree to our{' '}
            <span className="text-foreground cursor-pointer hover:underline">Terms</span> and{' '}
            <span className="text-foreground cursor-pointer hover:underline">Privacy Policy</span>.
          </p>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>

      {/* Right decorative panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 order-1 lg:order-2"
        style={{ background: 'linear-gradient(145deg, hsl(224 28% 7%) 0%, hsl(238 50% 12%) 60%, hsl(268 40% 14%) 100%)' }}
      >
        <div className="absolute top-[-60px] left-[-60px] w-[350px] h-[350px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(168 72% 46%), transparent 70%)' }} />
        <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(238 84% 68%), transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(hsl(210 30% 90%) 1px, transparent 1px), linear-gradient(90deg, hsl(210 30% 90%) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-lg font-semibold text-white">LifeOS</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <h2 className="font-serif text-4xl text-white leading-[1.15]">
            Everything you need<br />
            to <span className="italic text-white/60">achieve more</span><br />
            every single day.
          </h2>
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full gradient-primary flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm text-white/70">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 rounded-2xl p-5" style={{ background: 'hsl(224 24% 12% / 0.7)', border: '1px solid hsl(224 18% 20%)' }}>
          <p className="text-sm text-white/80 leading-relaxed italic mb-3">
            "LifeOS helped me go from scattered and overwhelmed to hitting my goals consistently. It's the only productivity tool I actually keep using."
          </p>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full gradient-accent flex items-center justify-center">
              <span className="text-white text-xs font-semibold">S</span>
            </div>
            <div>
              <p className="text-xs font-medium text-white">Sarah K.</p>
              <p className="text-[11px] text-white/40">Product designer</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
