import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Moon, Sunrise, Timer, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const steps = [
  {
    time: 'Morning',
    title: 'Daily Start',
    body: 'Set energy, pick your top 3, and know exactly what matters before notifications hijack you.',
    icon: Sunrise,
    tone: 'text-warning',
    ring: 'ring-warning/30',
    bg: 'bg-warning/10',
    reward: '+10 XP',
  },
  {
    time: 'Day',
    title: 'Meaningful work',
    body: 'Tasks, habits, focus blocks, and discipline tools all feed one progress bar — not four disconnected apps.',
    icon: Timer,
    tone: 'text-primary',
    ring: 'ring-primary/30',
    bg: 'bg-primary/10',
    reward: '+25 XP',
  },
  {
    time: 'Night',
    title: 'Evening Shutdown',
    body: 'Capture what moved, what slipped, and tomorrow\'s first move. Close the loop. Sleep without the mental tab open.',
    icon: Moon,
    tone: 'text-accent',
    ring: 'ring-accent/30',
    bg: 'bg-accent/10',
    reward: '+30 XP',
  },
];

export function LoopShowcaseSection() {
  return (
    <section id="loop" className="relative overflow-hidden border-t border-border/70 bg-secondary/30 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" aria-hidden />

      <div className="container relative mx-auto px-6">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-eyebrow mb-3">The hook</p>
          <h2 className="font-serif text-4xl leading-[1.08] text-foreground sm:text-5xl">
            One loop. Every day. No more open tabs in your head.
          </h2>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            Most tools help you start. LifeOS is built so you actually <span className="font-medium text-foreground">finish</span> — with proof you can see before midnight.
          </p>
        </motion.div>

        <div className="relative mx-auto mt-14 max-w-4xl">
          <div className="absolute left-[16%] right-[16%] top-12 hidden h-px bg-gradient-to-r from-warning/40 via-primary/50 to-accent/40 md:block" aria-hidden />

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.article
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`relative rounded-xl border border-border bg-card p-6 shadow-card ring-1 ${step.ring}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{step.time}</span>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-primary">{step.reward}</span>
                </div>
                <div className={`mt-5 grid h-11 w-11 place-items-center rounded-xl ${step.bg}`}>
                  <step.icon className={`h-5 w-5 ${step.tone}`} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
                {index < steps.length - 1 && (
                  <CheckCircle2 className="absolute -bottom-3 left-1/2 hidden h-6 w-6 -translate-x-1/2 text-success md:block" aria-hidden />
                )}
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          className="mx-auto mt-12 flex max-w-lg flex-col items-center gap-4 rounded-xl border border-primary/25 bg-card/90 p-6 text-center shadow-glow backdrop-blur sm:flex-row sm:text-left"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
            <Zap className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">First win in under 3 minutes</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Sign up → Daily Start → one task or habit → see your loop bar move. That&apos;s the moment people stay.
            </p>
          </div>
          <Link to="/signup" className="shrink-0">
            <Button className="gradient-primary text-primary-foreground shadow-glow">
              Try the loop
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
