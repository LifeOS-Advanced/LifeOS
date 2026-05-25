import { useEffect, useRef } from 'react';
import { consumePendingFirstHabit } from '@/lib/first-win';
import { useCreateHabit } from '@/lib/queries';

/** Creates the habit named during onboarding once the app shell is ready. */
export function PendingFirstHabit() {
  const createHabit = useCreateHabit();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    const title = consumePendingFirstHabit();
    if (!title) return;
    started.current = true;
    createHabit.mutate({
      title,
      description: '',
      frequency: 'daily',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
