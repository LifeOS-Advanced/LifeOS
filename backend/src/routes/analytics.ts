import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { ok, AppError } from '../utils/response';
import { getUserAnalyticsSummary, trackAnalyticsEvent } from '../services/analytics';
import type { AnalyticsEventType } from '../models/Index';

const router = Router();
router.use(protect);

const eventTypes: AnalyticsEventType[] = [
  'signup_completed',
  'onboarding_completed',
  'first_visit_guide_shown',
  'first_visit_guide_completed',
  'daily_start_completed',
  'first_xp_earned',
  'quest_completed',
  'all_daily_quests_completed',
  'evening_shutdown_completed',
  'daily_loop_closed',
  'streak_at_risk_shown',
  'weekly_review_completed',
];

function validate(req: Request, next: NextFunction): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0]?.msg ?? 'Validation failed', 400, 'VALIDATION_ERROR'));
    return false;
  }
  return true;
}

router.post(
  '/event',
  [
    body('type').isIn(eventTypes),
    body('occurredAt').optional().isISO8601(),
    body('dateKey').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    body('sessionId').optional().isString().isLength({ max: 120 }),
    body('source').optional().isIn(['frontend', 'backend']),
    body('metadata').optional().isObject(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!validate(req, next)) return;
      const event = await trackAnalyticsEvent({
        userId: req.userId,
        type: req.body.type,
        occurredAt: req.body.occurredAt ? new Date(req.body.occurredAt) : undefined,
        dateKey: req.body.dateKey,
        sessionId: req.body.sessionId,
        source: req.body.source,
        metadata: req.body.metadata,
      });
      ok(res, { event });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await getUserAnalyticsSummary(req.userId));
  } catch (err) {
    next(err);
  }
});

export default router;
