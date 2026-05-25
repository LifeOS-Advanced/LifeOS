import { motion } from 'framer-motion';
import { Activity, ArrowRight, BookOpen, CheckCircle2, Moon, Sunrise, Target, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';

const primaryFeatures = [
  {
    icon: Sunrise,
    title: 'Start with intention',
    description: 'Daily Start turns mood, energy, priorities, top tasks, habits, and focus time into one clear plan.',
    detail: 'Morning cue',
    tone: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    icon: Timer,
    title: 'Reward real work',
    description: 'XP, quests, streaks, and optional reward sounds fire only after meaningful actions, not random clicks.',
    detail: 'Healthy loop',
    tone: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Moon,
    title: 'Close the day',
    description: 'Evening Shutdown captures what moved, what got delayed, and tomorrow\'s first task before the day disappears.',
    detail: 'Daily closure',
    tone: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: BookOpen,
    title: 'Continue the story',
    description: 'Weekly Story and carry-forward threads show what should continue next, without shame or fake praise.',
    detail: 'Narrative memory',
    tone: 'text-success',
    bg: 'bg-success/10',
  },
];

const connectedModules = [
  { label: 'Tasks', icon: CheckCircle2 },
  { label: 'Habits', icon: Activity },
  { label: 'Goals', icon: Target },
  { label: 'Focus', icon: Timer },
];

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/70 bg-background pb-20 pt-4 lg:pb-24 lg:pt-6">
      <div className="container mx-auto px-6">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            <p className="text-eyebrow mb-3">Why it feels different</p>
            <h2 className="font-serif text-4xl leading-[1.08] text-foreground sm:text-5xl">
              A productivity system that remembers the day.
            </h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              LifeOS is not just a place to store tasks. It gives each day a beginning, a meaningful middle, and a clean ending.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {connectedModules.map(({ label, icon: Icon }) => (
                <span key={label} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {label}
                </span>
              ))}
            </div>
            <Link
              to="/signup"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              Build your first loop
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2">
            {primaryFeatures.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-lg border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/35"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`grid h-10 w-10 place-items-center rounded-lg ${feature.bg}`}>
                    <feature.icon className={`h-5 w-5 ${feature.tone}`} />
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
                    {feature.detail}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 rounded-lg border border-border bg-card p-5 shadow-card"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">True north</p>
              <p className="mt-2 text-lg font-semibold text-foreground">Loop Closure Rate</p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground md:col-span-2">
              The main win is not raw busyness. It is Daily Start completed, meaningful work done, and Evening Shutdown finished. That is the behavior LifeOS makes visible.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
