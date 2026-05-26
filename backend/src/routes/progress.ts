import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { UserProgress } from '../models/Index';
import { getProgressSnapshot, recordProgressEvent, ymd } from '../services/progress';
import { ok, AppError } from '../utils/response';

const router = Router();
router.use(protect);

function validate(req: Request, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0]?.msg ?? 'Validation failed', 400));
    return false;
  }
  return true;
}

router.get('/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await getProgressSnapshot(req.userId));
  } catch (err) { next(err); }
});

router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await UserProgress.findOne({ userId: req.userId }).lean();
    ok(res, {
      events: progress?.events?.slice(0, 100) ?? [],
      achievements: progress?.achievements ?? [],
    });
  } catch (err) { next(err); }
});

router.post('/event', [
  body('type').isIn([
    'task_completed',
    'habit_checked',
    'focus_completed',
    'daily_start',
    'evening_shutdown',
    'weekly_review',
    'urge_interrupted',
    'replacement_completed',
    'relapse_reviewed',
    'discipline_routine_completed',
    'quest_bonus',
    'daily_quests_complete',
  ]),
  body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  body('entityId').optional().isString().isLength({ max: 120 }),
  body('title').optional().isString().isLength({ max: 160 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('metadata').optional().isObject(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    ok(res, await recordProgressEvent({
      userId: req.userId,
      type: req.body.type,
      date: req.body.date ?? ymd(),
      entityId: req.body.entityId,
      title: req.body.title,
      description: req.body.description,
      metadata: req.body.metadata,
    }));
  } catch (err) { next(err); }
});

export default router;
