import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';

const faqs = [
  { q: 'What makes LifeOS different from other productivity apps?', a: 'LifeOS connects your tasks, habits, goals, notes, and focus sessions into one unified system. Instead of switching between five apps, everything works together to give you a complete picture of your progress.' },
  { q: 'Is LifeOS free to use?', a: 'LifeOS offers a generous free tier with access to all core modules. Premium features like advanced analytics and unlimited integrations are available on our Pro plan.' },
  { q: 'Can I use LifeOS on mobile?', a: 'Yes! LifeOS is fully responsive and works beautifully on any device. A native mobile app is on our roadmap for later this year.' },
  { q: 'How does the goal-task linking work?', a: 'When you create a task or habit, you can optionally link it to a goal. Your goal progress automatically updates as you complete linked items, giving you a clear path from daily actions to big achievements.' },
  { q: 'Can I customize which modules I see?', a: 'Absolutely. During onboarding, you choose your lifestyle mode and select which modules to enable. You can change these preferences anytime in settings.' },
];

export function FAQSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Frequently asked questions</h2>
          <p className="text-lg text-muted-foreground">Everything you need to know about LifeOS.</p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-border bg-card px-6 shadow-card">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
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
