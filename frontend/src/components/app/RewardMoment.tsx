import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { setLevelUpHandler } from '@/lib/reward-moments';

/** Global level-up dialog wired from emitRewardMoment. */
export function RewardMomentProvider() {
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    setLevelUpHandler(setLevel);
    return () => setLevelUpHandler(null);
  }, []);

  return (
    <Dialog open={level !== null} onOpenChange={(open) => !open && setLevel(null)}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader className="items-center">
          <AnimatePresence mode="wait">
            {level !== null && (
              <motion.div
                key={level}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto h-14 w-14 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center shadow-glow mb-2"
              >
                <Trophy className="h-7 w-7" />
              </motion.div>
            )}
          </AnimatePresence>
          <DialogTitle className="text-2xl">Level {level}</DialogTitle>
          <DialogDescription>
            You leveled up. Keep stacking small wins.
          </DialogDescription>
        </DialogHeader>
        <Button className="w-full gradient-primary text-primary-foreground" onClick={() => setLevel(null)}>
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}
