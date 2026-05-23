import { motion } from 'framer-motion';
import { ArrowRight, CheckSquare, Zap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// Animated floating card preview
function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-16 max-w-5xl mx-auto relative"
    >
      {/* Glow underneath */}
      <div className="absolute -inset-4 rounded-3xl opacity-30 blur-3xl"
        style={{ background: 'linear-gradient(135deg, hsl(238 84% 60% / 0.3), hsl(168 72% 42% / 0.2))' }} />

      {/* App chrome mockup */}
      <div className="relative rounded-2xl border border-border/60 overflow-hidden shadow-2xl bg-card">
        {/* Window bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/40 backdrop-blur-sm">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-destructive/70" />
            <div className="h-3 w-3 rounded-full bg-warning/70" />
            <div className="h-3 w-3 rounded-full bg-success/70" />
          </div>
          <div className="flex-1 mx-4">
            <div className="h-5 max-w-xs mx-auto rounded-full bg-border/50 flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground">app.lifeos.io/dashboard</span>
            </div>
          </div>
        </div>

        {/* Mock dashboard content */}
        <div className="flex" style={{ minHeight: 340 }}>
          {/* Sidebar */}
          <div className="w-48 border-r border-border shrink-0 p-3 space-y-1" style={{ background: 'hsl(224 28% 7%)' }}>
            <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center mb-4 ml-1">
              <span className="text-white text-xs font-bold">L</span>
            </div>
            {['Dashboard', 'Tasks', 'Habits', 'Goals', 'Notes', 'Focus'].map((item, i) => (
              <div key={item} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 ${i === 0 ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                <div className={`h-3 w-3 rounded-sm ${i === 0 ? 'gradient-primary' : 'bg-white/20'}`} />
                <span className={`text-xs ${i === 0 ? 'text-white font-medium' : 'text-white/40'}`}>{item}</span>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-5 space-y-4 bg-background">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-3 w-24 rounded-full shimmer mb-1.5" />
                <div className="h-5 w-40 rounded-full bg-foreground/8" />
              </div>
              <div className="h-7 w-24 rounded-lg gradient-primary opacity-80" />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Tasks done', val: '12', c: 'hsl(238 84% 60%)' },
                { label: 'Habit streak', val: '7d', c: 'hsl(168 72% 42%)' },
                { label: 'Goals', val: '3', c: 'hsl(38 95% 48%)' },
                { label: 'Focus', val: '2h', c: 'hsl(152 65% 38%)' },
              ].map(({ label, val, c }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                  <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                  <p className="text-lg font-bold" style={{ color: c }}>{val}</p>
                </div>
              ))}
            </div>

            {/* Today plan card */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-4 rounded-sm gradient-primary" />
                <span className="text-xs font-semibold text-foreground">Today's Plan</span>
              </div>
              <div className="space-y-2">
                {['Finish product proposal', 'Review pull request', '30-min workout'].map((task) => (
                  <div key={task} className="flex items-center gap-2.5">
                    <div className="h-4 w-4 rounded-full border-2 border-border shrink-0" />
                    <span className="text-xs text-muted-foreground">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(238 84% 60%), transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.05] blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(168 72% 42%), transparent 70%)' }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(hsl(222 35% 9%) 1px, transparent 1px), linear-gradient(90deg, hsl(222 35% 9%) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

      <div className="relative container mx-auto px-6 pt-28 pb-12 lg:pt-40 lg:pb-20">
        <motion.div variants={stagger} initial="initial" animate="animate" className="max-w-4xl mx-auto text-center">

          {/* Eyebrow badge */}
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground mb-8 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full gradient-primary" />
              Now in public beta — free to use
            </span>
          </motion.div>

          {/* Headline with serif accent */}
          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.06] mb-6">
            Your life, running like{' '}
            <span className="font-serif italic text-foreground/75">a clean</span>
            <br />
            <span className="">operating system.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Tasks. Habits. Goals. Notes. Focus sessions — all woven into one
            intelligent workspace that works the way your mind does.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="gradient-primary text-white px-8 h-12 text-sm font-semibold shadow-glow hover:opacity-90 transition-opacity rounded-xl">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="h-12 px-8 text-sm font-medium rounded-xl border-border hover:border-primary/40 hover:bg-secondary/60">
                Sign in to existing account
              </Button>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeUp} className="mt-8 flex items-center justify-center gap-6">
            {[
              { icon: CheckSquare, text: 'No credit card' },
              { icon: Zap, text: 'Set up in 2 min' },
              { icon: Target, text: 'Works offline' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-primary/70" />
                {text}
              </div>
            ))}
          </motion.div>
        </motion.div>

        <DashboardPreview />
      </div>
    </section>
  );
}