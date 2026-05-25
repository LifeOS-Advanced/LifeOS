import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { DailyCheckIn, DailyStart, EveningShutdown } from '../models/Index';
import { ok, AppError } from '../utils/response';
import { recordProgressEvent } from '../services/progress';
import { trackAnalyticsEventSafe } from '../services/analytics';

const router = Router();
router.use(protect);

const dateValidator = body('date').matches(/^\d{4}-\d{2}-\d{2}$/);
const taskIdsValidator = (field: string) => body(field).optional().isArray({ max: 20 });
const objectIdsValidator = (field: string) => body(`${field}.*`).optional().isMongoId();

function v(req: Request, next: NextFunction) {
  const e = validationResult(req);
  if (!e.isEmpty()) {
    next(new AppError(e.array()[0]?.msg ?? 'Validation failed', 400));
    return false;
  }
  return true;
}

const today = () => new Date().toISOString().split('T')[0];

router.get('/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = typeof req.query.date === 'string' ? req.query.date : today();
    const [dailyStart, eveningShutdown] = await Promise.all([
      DailyStart.findOne({ userId: req.userId, date }).lean(),
      EveningShutdown.findOne({ userId: req.userId, date }).lean(),
    ]);
    ok(res, { dailyStart, eveningShutdown });
  } catch (err) { next(err); }
});

router.get('/start', [
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const date = typeof req.query.date === 'string' ? req.query.date : today();
    ok(res, await DailyStart.findOne({ userId: req.userId, date }).lean());
  } catch (err) { next(err); }
});

router.post('/start', [
  dateValidator,
  body('mood').isInt({ min: 1, max: 5 }),
  body('energy').isIn(['low', 'medium', 'high']),
  body('mainPriority').trim().notEmpty().isLength({ max: 200 }),
  taskIdsValidator('topTaskIds'),
  objectIdsValidator('topTaskIds'),
  taskIdsValidator('habitIds'),
  objectIdsValidator('habitIds'),
  body('suggestedFocusDuration').isInt({ min: 5, max: 180 }),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const doc = await DailyStart.findOneAndUpdate(
      { userId: req.userId, date: req.body.date },
      { $set: { ...req.body, userId: req.userId, confirmedAt: new Date() } },
      { new: true, upsert: true, runValidators: true }
    );
    const progress = await recordProgressEvent({
      userId: req.userId,
      type: 'daily_start',
      entityId: req.body.date,
      date: req.body.date,
      title: 'Daily Start completed',
      description: req.body.mainPriority,
      metadata: { key: `daily_start:${req.body.date}` },
    });
    await trackAnalyticsEventSafe({
      userId: req.userId,
      type: 'daily_start_completed',
      dateKey: req.body.date,
      source: 'backend',
      metadata: { mainPriority: req.body.mainPriority },
    });
    ok(res, { flow: doc, progress });
  } catch (err) { next(err); }
});

router.get('/shutdown', [
  query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const date = typeof req.query.date === 'string' ? req.query.date : today();
    ok(res, await EveningShutdown.findOne({ userId: req.userId, date }).lean());
  } catch (err) { next(err); }
});

router.post('/shutdown', [
  dateValidator,
  taskIdsValidator('completedTaskIds'),
  objectIdsValidator('completedTaskIds'),
  taskIdsValidator('delayedTaskIds'),
  objectIdsValidator('delayedTaskIds'),
  body('mood').isInt({ min: 1, max: 5 }),
  body('energy').isIn(['low', 'medium', 'high']),
  body('wentWell').optional().isString().isLength({ max: 2000 }),
  body('improveTomorrow').optional().isString().isLength({ max: 2000 }),
  body('tomorrowFirstTask').optional().isString().isLength({ max: 200 }),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const doc = await EveningShutdown.findOneAndUpdate(
      { userId: req.userId, date: req.body.date },
      { $set: { ...req.body, userId: req.userId } },
      { new: true, upsert: true, runValidators: true }
    );

    await DailyCheckIn.findOneAndUpdate(
      { userId: req.userId, date: req.body.date },
      {
        $set: {
          userId: req.userId,
          date: req.body.date,
          mood: req.body.mood,
          energy: req.body.energy,
          mainFocus: req.body.tomorrowFirstTask || req.body.improveTomorrow || 'Plan tomorrow',
          oneWord: req.body.wentWell?.split(/\s+/)[0]?.slice(0, 50) || 'done',
        },
      },
      { upsert: true, runValidators: true }
    );

    const progress = await recordProgressEvent({
      userId: req.userId,
      type: 'evening_shutdown',
      entityId: req.body.date,
      date: req.body.date,
      title: 'Evening Shutdown completed',
      description: req.body.tomorrowFirstTask || 'Day closed',
      metadata: { key: `evening_shutdown:${req.body.date}` },
    });
    await trackAnalyticsEventSafe({
      userId: req.userId,
      type: 'evening_shutdown_completed',
      dateKey: req.body.date,
      source: 'backend',
    });
    const dailyStart = await DailyStart.exists({ userId: req.userId, date: req.body.date });
    if (dailyStart) {
      await trackAnalyticsEventSafe({
        userId: req.userId,
        type: 'daily_loop_closed',
        dateKey: req.body.date,
        source: 'backend',
      });
    }

    ok(res, { flow: doc, progress });
  } catch (err) { next(err); }
});

export default router;
