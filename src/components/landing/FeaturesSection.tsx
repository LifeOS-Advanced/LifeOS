import { motion } from 'framer-motion';
import { CheckSquare, Target, BookOpen, Timer, BarChart3, Zap } from 'lucide-react';

const features = [
  { icon: CheckSquare, title: 'Smart Tasks', description: 'Organize with priorities, tags, and goal linking. Board or list view.', color: 'text-primary' },
  { icon: Zap, title: 'Habit Tracking', description: 'Build streaks, track daily habits, and see your consistency grow.', color: 'text-accent' },
  { icon: Target, title: 'Goal System', description: 'Set goals with milestones, link tasks and habits, track progress.', color: 'text-warning' },
  { icon: BookOpen, title: 'Quick Notes', description: 'Capture ideas instantly. Pin, tag, and search your knowledge.', color: 'text-info' },
  { icon: Timer, title: 'Focus Timer', description: 'Pomodoro sessions with labels and distraction tracking.', color: 'text-success' },
  { icon: BarChart3, title: 'Life Dashboard', description: 'See your entire life system at a glance with smart widgets.', color: 'text-primary' },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything you need, nothing you don't
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Six powerful modules that work together as one connected system.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group relative rounded-2xl border border-border bg-card p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mb-5 ${feature.color}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
