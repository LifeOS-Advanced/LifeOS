import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  tip?: string;
}

export function EmptyState({ icon: Icon, title, description, ctaLabel, onCta, tip }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-dashed border-border bg-gradient-to-br from-card via-card to-secondary/35 px-6 py-14 text-center shadow-card"
    >
      <div className="pointer-events-none absolute inset-x-12 -top-24 h-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground shadow-glow mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="relative text-lg font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="relative text-sm text-muted-foreground max-w-md mx-auto mb-5">{description}</p>
      {ctaLabel && onCta && (
        <Button onClick={onCta} className="relative gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
          {ctaLabel}
        </Button>
      )}
      {tip && (
        <p className="relative mt-5 text-xs text-muted-foreground">Tip: {tip}</p>
      )}
    </motion.div>
  );
}
