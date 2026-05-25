import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const faqs = [
  {
    q: 'What makes LifeOS different from a normal task manager?',
    a: 'LifeOS is built around the full day loop: plan the day, complete meaningful work, and close the day with reflection. Tasks, habits, goals, focus sessions, and reviews all feed that loop.',
  },
  {
    q: 'Is the reward system childish?',
    a: 'No. XP, levels, streaks, and optional sounds are designed as quiet feedback for meaningful work. There are no loot boxes, random currencies, shame messages, or social pressure.',
  },
  {
    q: 'How quickly can I feel value?',
    a: 'The first-session flow is designed around earning a real first win in under 3 minutes: create or check a habit, complete a small task, or run a short focus sprint.',
  },
  {
    q: 'Does LifeOS remember what should continue next?',
    a: 'Yes. Weekly Story and carry-forward threads can surface unfinished areas, paused goals, and the next honest move without turning it into pressure.',
  },
  {
    q: 'Can I customize the system?',
    a: 'Yes. Onboarding, modules, dashboard widgets, reminders, accent colors, focus defaults, and sensory reward sounds can all be adjusted from Settings.',
  },
];

export function FAQSection() {
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6">
        <motion.div
          className="mx-auto mb-12 max-w-2xl text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-eyebrow mb-3">Questions</p>
          <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Before your first loop</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            A few details about how LifeOS keeps the loop useful, serious, and user-controlled.
          </p>
        </motion.div>

        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`faq-${i}`} className="rounded-lg border border-border bg-card px-5 shadow-card">
                <AccordionTrigger className="py-5 text-left font-semibold text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
