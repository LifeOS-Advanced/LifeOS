import type { DailyLoopPhase } from './daily-loop';
import type { ImprovementArea } from './types';

export type QuoteContext = 'morning' | 'afternoon' | 'evening' | 'loop' | 'reward' | 'first_visit';

const GENERAL: Record<QuoteContext, string[]> = {
  morning: [
    'Small plans, repeated daily, become a life.',
    'You don’t need a perfect day — you need a clear first move.',
    'Morning clarity is a gift you give your future self.',
    'Show up for ten minutes; momentum handles the rest.',
  ],
  afternoon: [
    'Progress is quiet until you pause and notice it.',
    'The middle of the day is where intentions meet reality.',
    'One focused block beats a scattered twelve hours.',
    'Keep the promise you made this morning.',
  ],
  evening: [
    'Closing the day is how tomorrow earns your trust.',
    'Reflection turns activity into wisdom.',
    'Rest is part of the work when the loop is closed.',
    'Park one task for tomorrow — then let go.',
  ],
  loop: [
    'A closed loop today gives tomorrow a clearer start.',
    'Consistency is the compound interest of self-respect.',
    'A repeated rhythm beats chasing a mood.',
    'Each quest finished leaves a clearer record.',
  ],
  reward: [
    'That counted. Stack another small win.',
    'Effort logged — your future self noticed.',
    'Progress isn’t luck; it’s repetition.',
    'You showed up. That’s the whole game.',
  ],
  first_visit: [
    'Welcome. One ritual at a time is enough to start.',
    'You don’t need to learn everything — just your next step.',
    'LifeOS works when the day has a beginning and an end.',
  ],
};

const BY_FOCUS: Record<ImprovementArea, string[]> = {
  discipline: [
    'Discipline is choosing what you want most over what you want now.',
    'Freedom grows where habits hold the line.',
  ],
  studying: [
    'Understanding compounds when study becomes ritual.',
    'One chapter today beats ten chapters “someday.”',
  ],
  productivity: [
    'Productivity is peace of mind as a default setting.',
    'Finish what matters; let the rest wait its turn.',
  ],
  health: [
    'Health is built in ordinary minutes, not heroic weeks.',
    'Your body keeps score of small daily choices.',
  ],
  money: [
    'Wealth follows clarity before it follows hustle.',
    'Track the work that moves the number.',
  ],
  focus: [
    'Deep work is a superpower in a shallow world.',
    'Protect the block — everything else can queue.',
  ],
};

function hashDay(seed: string): number {
  const day = new Date().toISOString().split('T')[0];
  let h = 0;
  const s = `${day}:${seed}`;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 1)) % 9973;
  return h;
}

export function getTimeQuoteContext(): QuoteContext {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function pickQuote(opts?: {
  context?: QuoteContext;
  phase?: DailyLoopPhase;
  improvementFocus?: ImprovementArea[];
  seed?: string;
}): string {
  const timeCtx = opts?.context ?? getTimeQuoteContext();
  const pool = [...(GENERAL[timeCtx] ?? GENERAL.morning)];

  if (opts?.phase === 'complete') pool.push(...GENERAL.loop);
  if (opts?.phase === 'start_day') pool.push(...GENERAL.morning);
  if (opts?.phase === 'close_day') pool.push(...GENERAL.evening);
  if (opts?.context === 'first_visit') return GENERAL.first_visit[hashDay('first') % GENERAL.first_visit.length];

  const focus = opts?.improvementFocus?.[0];
  if (focus && BY_FOCUS[focus]) {
    pool.push(...BY_FOCUS[focus]);
  }

  const seed = opts?.seed ?? timeCtx;
  return pool[hashDay(seed) % pool.length] ?? pool[0];
}

/** Short line for toast descriptions after rewards */
export function pickRewardQuote(): string {
  return pickQuote({ context: 'reward', seed: 'reward' });
}
