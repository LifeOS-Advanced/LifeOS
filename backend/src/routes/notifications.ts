/**
 * Phase 2 — Browser push notifications (scaffold).
 * Requires: VAPID keys, PushSubscription model, cron or scheduled dispatch.
 * Endpoints: POST /subscribe, DELETE /subscribe, POST /dispatch (internal/cron).
 */
import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/auth';
import { ok } from '../utils/response';

const router = Router();
router.use(protect);

router.get('/status', (_req: Request, res: Response) => {
  ok(res, {
    phase: 2,
    enabled: false,
    message: 'Push delivery not configured. In-app reminders are active in Phase 1.',
  });
});

router.post('/subscribe', (_req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, { subscribed: false, message: 'Phase 2: store PushSubscription + VAPID' });
  } catch (err) {
    next(err);
  }
});

export default router;
