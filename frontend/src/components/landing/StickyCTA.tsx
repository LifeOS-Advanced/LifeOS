import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { hasActiveSession } from '@/lib/session';

export function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const signedIn = hasActiveSession();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (signedIn) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 px-4 py-3 backdrop-blur-xl"
        >
          <div className="container mx-auto flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-center text-sm font-medium text-foreground sm:text-left">
              Ready to close your first day on purpose?
            </p>
            <Link to="/signup">
              <Button size="sm" className="gradient-primary text-primary-foreground shadow-glow">
                Start free — first loop in 3 min
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// re-export for Navbar if needed - getAppEntryPath used in Navbar separately
