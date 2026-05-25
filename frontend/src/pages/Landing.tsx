import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <div id="features"><FeaturesSection /></div>
      <div id="testimonials"><TestimonialsSection /></div>

      {/* CTA Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-6">
          <motion.div
            className="mx-auto grid max-w-5xl gap-8 rounded-lg border border-border bg-card p-7 shadow-card md:grid-cols-[1fr_auto] md:items-center md:p-9"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <p className="text-eyebrow mb-3">Start small</p>
              <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                Build one complete day first.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                Create an account, finish Daily Start, complete one meaningful action, and close the day. That is enough to feel the system working.
              </p>
            </div>
            <Link to="/signup" className="md:justify-self-end">
              <Button size="lg" className="h-12 rounded-lg gradient-primary px-7 text-sm font-semibold text-primary-foreground shadow-glow">
                Start your first loop
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <div id="faq"><FAQSection /></div>
      <Footer />
    </div>
  );
}
