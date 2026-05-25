import { Quote } from 'lucide-react';
import { pickQuote, type QuoteContext } from '@/lib/motivational-quotes';
import type { DailyLoopPhase } from '@/lib/daily-loop';
import type { ImprovementArea } from '@/lib/types';

interface MotivationalQuoteBarProps {
  context?: QuoteContext;
  phase?: DailyLoopPhase;
  improvementFocus?: ImprovementArea[];
  className?: string;
}

export function MotivationalQuoteBar({ context, phase, improvementFocus, className = '' }: MotivationalQuoteBarProps) {
  const quote = pickQuote({ context, phase, improvementFocus });

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5 ${className}`}
    >
      <Quote className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
    </div>
  );
}
