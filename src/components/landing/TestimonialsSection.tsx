import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  { name: 'Alex Chen', role: 'Graduate Student', quote: 'LifeOS replaced five different apps for me. Everything is connected and my productivity has doubled.', avatar: 'AC' },
  { name: 'Sarah Kim', role: 'Freelance Designer', quote: 'The habit tracking linked to goals is genius. I finally feel like I\'m making real progress.', avatar: 'SK' },
  { name: 'James Wright', role: 'Software Engineer', quote: 'Clean, fast, and thoughtfully designed. The focus timer alone was worth switching from my old setup.', avatar: 'JW' },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-secondary/50">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Loved by productive people</h2>
          <p className="text-lg text-muted-foreground">Join thousands who've transformed how they manage their lives.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="rounded-2xl border border-border bg-card p-8 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-muted-foreground text-sm">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
