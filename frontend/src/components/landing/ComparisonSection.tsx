import { motion } from 'framer-motion';
import { ArrowRight, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const without = [
  'Tasks in one app, habits in another, goals forgotten',
  'Busy all day but no proof you moved what matters',
  'Guilt at midnight — "where did the day go?"',
  'Streak apps that punish you instead of helping you return',
];

const withLifeOS = [
  'Morning plan → focused work → evening closure in one place',
  'Loop bar, XP, and weekly story show real evidence',
  'Tomorrow\'s first task already chosen before you sleep',
  'Recovery built in — return without shame language',
];

export function ComparisonSection() {
  return (
    <section className="border-t border-border/70 bg-background py-24">
      <div className="container mx-auto px-6">
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-eyebrow mb-3">Why switch</p>
          <h2 className="font-serif text-4xl leading-[1.08] text-foreground sm:text-5xl">
            You don&apos;t need more lists. You need days that close.
          </h2>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border bg-card/60 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Without LifeOS</p>
            <ul className="mt-5 space-y-4">
              {without.map(item => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive/80" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-primary/30 bg-card p-6 shadow-glow"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">With LifeOS</p>
            <ul className="mt-5 space-y-4">
              {withLifeOS.map(item => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              Start closing days
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
