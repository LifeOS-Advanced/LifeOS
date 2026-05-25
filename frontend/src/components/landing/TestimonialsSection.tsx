import { motion } from 'framer-motion';
import { CheckCircle2, Compass, LineChart, RefreshCw } from 'lucide-react';

const proofPoints = [
  {
    icon: Compass,
    title: 'One obvious next step',
    copy: 'New users land on a guided first-win path instead of a dense dashboard with no direction.',
  },
  {
    icon: LineChart,
    title: 'Progress with evidence',
    copy: 'The app reflects what happened: closed days, protected focus, moved goals, and unfinished threads.',
  },
  {
    icon: RefreshCw,
    title: 'Recovery without shame',
    copy: 'Streak freezes and neutral copy help users return without feeling like the system is scolding them.',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-secondary/45 py-20">
      <div className="container mx-auto px-6">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-eyebrow mb-3">Built for trust</p>
          <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Motivation without turning your life into a toy.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            LifeOS uses reward feedback, but the system stays serious: no loot boxes, no social pressure, no shame language.
          </p>
        </motion.div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          {proofPoints.map((point, index) => (
            <motion.article
              key={point.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-lg border border-border bg-card p-6 shadow-card"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <point.icon className="h-5 w-5" />
                </div>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{point.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{point.copy}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
