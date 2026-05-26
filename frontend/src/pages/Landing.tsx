import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { LoopShowcaseSection } from '@/components/landing/LoopShowcaseSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { Footer } from '@/components/landing/Footer';
import { StickyCTA } from '@/components/landing/StickyCTA';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <LoopShowcaseSection />
      <ComparisonSection />
      <div id="features"><FeaturesSection /></div>
      <div id="testimonials"><TestimonialsSection /></div>

      {/* Final CTA — high contrast hook */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_120%,hsl(var(--primary)/0.22),transparent)]" aria-hidden />
        <div className="container relative mx-auto px-6">
          <motion.div
            className="mx-auto max-w-3xl rounded-2xl border border-primary/25 bg-card p-8 text-center shadow-glow sm:p-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-3xl leading-tight text-foreground sm:text-5xl">
              Tonight, close the day on purpose.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Not another productivity app — a daily operating system. Plan in the morning, do meaningful work, shut down at night. Free to start.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" className="h-12 rounded-lg gradient-primary px-8 text-sm font-semibold text-primary-foreground shadow-glow">
                  Create your account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="h-12 rounded-lg border-border px-8 text-sm font-medium">
                  I already have an account
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">No credit card · First loop in under 3 minutes</p>
          </motion.div>
        </div>
      </section>

      <div id="faq"><FAQSection /></div>
      <Footer />
      <StickyCTA />
    </div>
  );
}
