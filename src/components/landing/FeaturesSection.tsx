import { motion } from 'framer-motion';
import { CheckSquare, Target, BookOpen, Timer, BarChart3, Zap } from 'lucide-react';

const features = [
  {
    icon: CheckSquare,
    title: 'Smart Tasks',
    description: 'Organize with priorities, tags, and goal linking. Board or list view. Recurring tasks, subtasks, and due dates built in.',
    color: 'hsl(238 84% 60%)',
    bg: 'hsl(238 84% 60% / 0.08)',
    size: 'large',
  },
  {
    icon: Zap,
    title: 'Habit Tracking',
    description: 'Build streaks, track daily habits, and see your consistency grow over time.',
    color: 'hsl(168 72% 42%)',
    bg: 'hsl(168 72% 42% / 0.08)',
    size: 'small',
  },
  {
    icon: Target,
    title: 'Goal System',
    description: 'Set goals with milestones, link tasks and habits, track progress with visual indicators.',
    color: 'hsl(38 95% 48%)',
    bg: 'hsl(38 95% 48% / 0.08)',
    size: 'small',
  },
  {
    icon: BookOpen,
    title: 'Quick Notes',
    description: 'Capture ideas instantly. Pin, tag, and search your knowledge base with rich text support.',
    color: 'hsl(210 88% 52%)',
    bg: 'hsl(210 88% 52% / 0.08)',
    size: 'small',
  },
  {
    icon: Timer,
    title: 'Focus Timer',
    description: 'Pomodoro sessions with labels and distraction tracking for deep work.',
    color: 'hsl(152 65% 38%)',
    bg: 'hsl(152 65% 38% / 0.08)',
    size: 'small',
  },
  {
    icon: BarChart3,
    title: 'Life Insights',
    description: 'See your entire life system at a glance. Completion trends, focus analytics, and habit streaks in one place.',
    color: 'hsl(268 80% 55%)',
    bg: 'hsl(268 80% 55% / 0.08)',
    size: 'large',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-28 bg-background relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.018]"
        style={{ backgroundImage: 'radial-gradient(hsl(222 35% 9%) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="relative container mx-auto px-6">
        <motion.div
          className="max-w-xl mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-eyebrow mb-3">What's inside</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-foreground leading-[1.1] mb-4">
            Six modules.<br />
            <span className="italic text-muted-foreground">One system.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Every tool you need to manage your work, health, and personal growth — all talking to each other.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className={`group relative rounded-2xl border border-border bg-card p-7 overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-default ${feature.size === 'large' && i === 0 ? 'md:col-span-2 lg:col-span-2' : ''} ${feature.size === 'large' && i === 5 ? 'md:col-span-2 lg:col-span-2' : ''}`}
              style={{ boxShadow: 'var(--shadow-md)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Ambient color glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 20% 50%, ${feature.color.replace(')', ' / 0.06)')}, transparent 70%)` }}
              />

              <div className="relative z-10">
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: feature.bg, color: feature.color }}
                >
                  <feature.icon className="h-5 w-5" />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>

                {/* Decorative corner accent */}
                <div
                  className="absolute bottom-0 right-0 h-24 w-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 100% 100%, ${feature.color.replace(')', ' / 0.12)')}, transparent 70%)`,
                    borderRadius: '0 0 1rem 0',
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          className="text-center text-sm text-muted-foreground mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          All modules work together — tasks linked to goals, habits linked to goals, notes linked to tasks.
          <span className="text-foreground font-medium"> One connected system.</span>
        </motion.p>
      </div>
    </section>
  );
}