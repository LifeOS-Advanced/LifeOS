import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Moon,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Target,
  Timer,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } },
};

const loopSteps = [
  { label: 'Daily Start', icon: Sunrise, tone: 'text-warning', done: true },
  { label: 'Meaningful work', icon: Timer, tone: 'text-primary', done: true },
  { label: 'Evening Shutdown', icon: Moon, tone: 'text-accent', done: false },
];

function MetricTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-border/80 bg-card/88 p-3 shadow-sm backdrop-blur">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function ProductScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-y-0 right-0 w-full lg:w-[72%]">
        <motion.div
          initial={{ opacity: 0, x: 36, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -right-24 top-24 w-[920px] max-w-none rounded-lg border border-border bg-card shadow-xl lg:right-[-90px]"
        >
          <div className="flex h-11 items-center gap-2 border-b border-border bg-secondary/55 px-4">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/75" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/75" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/75" />
            <div className="mx-auto h-5 w-64 rounded-full bg-card/80 text-center text-[10px] leading-5 text-muted-foreground">
              LifeOS daily loop
            </div>
          </div>

          <div className="grid min-h-[520px] grid-cols-[190px_1fr]">
            <aside className="border-r border-border bg-sidebar-background p-4 text-sidebar-foreground">
              <div className="mb-5 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-xs font-bold text-primary-foreground">
                  L
                </div>
                <span className="text-sm font-semibold">LifeOS</span>
              </div>
              {['Dashboard', 'Tasks', 'Habits', 'Goals', 'Focus', 'Review'].map((item, index) => (
                <div
                  key={item}
                  className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                    index === 0 ? 'bg-white/10 text-white' : 'text-white/45'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-white/20'}`} />
                  {item}
                </div>
              ))}
            </aside>

            <main className="space-y-4 bg-background p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Monday, May 25</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">Good morning, Alex.</p>
                </div>
                <div className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                  Loop 80%
                </div>
              </div>

              <section className="rounded-lg border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Next reward</p>
                    <p className="mt-1 text-sm text-muted-foreground">Close the day with Evening Shutdown</p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    +30 XP
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: '42%' }}
                    animate={{ width: '80%' }}
                    transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full gradient-primary"
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {loopSteps.map(({ label, icon: Icon, tone, done }) => (
                    <div key={label} className="rounded-lg bg-secondary/60 p-3">
                      <div className="flex items-center justify-between">
                        <Icon className={`h-4 w-4 ${tone}`} />
                        {done && <CheckCircle2 className="h-4 w-4 text-success" />}
                      </div>
                      <p className="mt-3 text-[11px] font-medium text-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-3 gap-3">
                <MetricTile label="Closed days" value="4" tone="text-accent" />
                <MetricTile label="Focus protected" value="2h 10m" tone="text-primary" />
                <MetricTile label="Habits kept" value="9" tone="text-success" />
              </div>

              <div className="grid grid-cols-[1.1fr_0.9fr] gap-4">
                <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold text-foreground">Weekly thread</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Work took most of your focus. Give Health one small action next.
                  </p>
                </section>
                <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold text-foreground">Recent pattern</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    You protected your priorities 6 times this week.
                  </p>
                </section>
              </div>
            </main>
          </div>
        </motion.div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background))_36%,hsl(var(--background)/0.82)_55%,hsl(var(--background)/0.2)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,hsl(var(--background)))]" />
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[78svh] overflow-hidden">
      <ProductScene />

      <div className="relative container mx-auto px-6 pb-8 pt-24 sm:pt-28 lg:pb-10 lg:pt-32">
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="max-w-2xl"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Public beta - built around daily loop closure
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-7 text-5xl font-semibold leading-[1.04] text-foreground sm:text-6xl lg:text-7xl"
          >
            Turn scattered effort into a day you can close.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg"
          >
            LifeOS connects Daily Start, focused work, habits, goals, and Evening Shutdown so progress feels visible before the day ends.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/signup">
              <Button size="lg" className="h-12 rounded-lg gradient-primary px-7 text-sm font-semibold text-primary-foreground shadow-glow">
                Start your first loop
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="h-12 rounded-lg border-border bg-card/70 px-7 text-sm font-medium backdrop-blur hover:border-primary/40">
                See the system
              </Button>
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { icon: Sparkles, text: 'First win in under 3 minutes' },
              { icon: Target, text: 'Actions connect to goals' },
              { icon: Moon, text: 'Days end with closure' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
      <a
        href="#features"
        className="absolute inset-x-0 bottom-0 border-t border-border/70 bg-background/90 px-6 py-2 text-center text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
      >
        Next: why LifeOS feels different
      </a>
    </section>
  );
}
