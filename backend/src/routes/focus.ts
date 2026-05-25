// ── focus.ts ──────────────────────────────────────────────────
import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { FocusSession, DailyCheckIn, WeeklyReview } from '../models/Index'; // fix: capital I to match filename on case-sensitive FS
import { User } from '../models/User';
import { ok, created, noContent, AppError } from '../utils/response';
import { recordProgressEvent } from '../services/progress';

// ── Focus Sessions ────────────────────────────────────────────
export const focusRouter = Router();
focusRouter.use(protect);

function v(req: Request, next: NextFunction) {
  const e = validationResult(req);
  if (!e.isEmpty()) { next(new AppError(e.array()[0]?.msg ?? 'Validation failed', 400)); return false; }
  return true;
}

focusRouter.get('/', [
  query('from').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  query('to').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const filter: Record<string, unknown> = { userId: req.userId };
    if (req.query.from || req.query.to) {
      filter.completedAt = {
        ...(req.query.from ? { $gte: req.query.from } : {}),
        ...(req.query.to ? { $lte: req.query.to } : {}),
      };
    }
    const sessions = await FocusSession.find(filter).sort('-completedAt').lean();
    ok(res, sessions);
  } catch (err) { next(err); }
});

focusRouter.post('/', [
  body('label').trim().notEmpty().isLength({ max: 120 }),
  body('duration').isInt({ min: 1, max: 300 }),
  body('completedAt').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('completedAt must be YYYY-MM-DD'),
  body('sessionGoal').optional().isString().isLength({ max: 500 }),
  body('interruptions').optional().isInt({ min: 0 }),
  body('taskId').optional().isMongoId(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const session = await FocusSession.create({ ...req.body, userId: req.userId });
    const progress = await recordProgressEvent({
      userId: req.userId,
      type: 'focus_completed',
      entityId: String(session._id),
      date: session.completedAt,
      title: 'Focus sprint finished',
      description: `${session.duration} minutes of ${session.label}`,
      metadata: { duration: session.duration, taskId: session.taskId ? String(session.taskId) : undefined },
    });
    created(res, { session, progress });
  } catch (err) { next(err); }
});

focusRouter.delete('/:id', [param('id').isMongoId()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!v(req, next)) return;
      const session = await FocusSession.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!session) throw new AppError('Session not found', 404);
      noContent(res);
    } catch (err) { next(err); }
  }
);

export default focusRouter;

// ── Check-ins ─────────────────────────────────────────────────
export const checkInRouter = Router();
checkInRouter.use(protect);

checkInRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const checkIns = await DailyCheckIn.find({ userId: req.userId }).sort('-date').limit(90).lean();
    ok(res, checkIns);
  } catch (err) { next(err); }
});

checkInRouter.get('/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const checkIn = await DailyCheckIn.findOne({ userId: req.userId, date: today }).lean();
    ok(res, checkIn ?? null);
  } catch (err) { next(err); }
});

checkInRouter.post('/', [
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('mood').isInt({ min: 1, max: 5 }),
  body('energy').isIn(['low', 'medium', 'high']),
  body('mainFocus').trim().notEmpty().isLength({ max: 200 }),
  body('oneWord').trim().notEmpty().isLength({ max: 50 }),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const checkIn = await DailyCheckIn.findOneAndUpdate(
      { userId: req.userId, date: req.body.date },
      { $set: { ...req.body, userId: req.userId } },
      { new: true, upsert: true, runValidators: true }
    );
    ok(res, checkIn);
  } catch (err) { next(err); }
});

// ── Weekly Reviews ────────────────────────────────────────────
export const reviewRouter = Router();
reviewRouter.use(protect);

reviewRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await WeeklyReview.find({ userId: req.userId }).sort('-weekStart').limit(52).lean();
    ok(res, reviews);
  } catch (err) { next(err); }
});

reviewRouter.post('/', [
  body('weekStart').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('wentWell').optional().isString().isLength({ max: 2000 }),
  body('gotIgnored').optional().isString().isLength({ max: 2000 }),
  body('improveNext').optional().isString().isLength({ max: 2000 }),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const review = await WeeklyReview.findOneAndUpdate(
      { userId: req.userId, weekStart: req.body.weekStart },
      { $set: { ...req.body, userId: req.userId } },
      { new: true, upsert: true, runValidators: true }
    );
    const progress = await recordProgressEvent({
      userId: req.userId,
      type: 'weekly_review',
      entityId: req.body.weekStart,
      date: req.body.weekStart,
      title: 'Weekly Reset completed',
      description: 'You closed the week and earned a streak freeze.',
      metadata: { key: `weekly_review:${req.body.weekStart}` },
    });
    ok(res, { review, progress });
  } catch (err) { next(err); }
});

// ── Profile ───────────────────────────────────────────────────
export const profileRouter = Router();
profileRouter.use(protect);

profileRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError('User not found', 404);
    ok(res, user);
  } catch (err) { next(err); }
});

profileRouter.put('/', [
  body('name').optional().trim().isLength({ min: 1, max: 80 }),
  body('theme').optional().isIn(['light', 'dark', 'system']),
  body('lifestyleMode').optional().isIn(['student', 'freelancer', 'employee', 'creator', 'personal-growth']),
  body('enabledModules').optional().isArray(),
  body('preferences').optional().isObject(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    // Don't allow overwriting email/password/provider via this route
    const safeBody = { ...req.body };
    delete safeBody.email;
    delete safeBody.password;
    delete safeBody.provider;
    delete safeBody.refreshTokens;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: safeBody },
      { new: true, runValidators: true }
    );
    if (!user) throw new AppError('User not found', 404);
    ok(res, user);
  } catch (err) { next(err); }
});

profileRouter.patch('/password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8, max: 128 }),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const user = await User.findById(req.userId).select('+password');
    if (!user) throw new AppError('User not found', 404);
    if (!(await user.comparePassword(req.body.currentPassword))) {
      throw new AppError('Current password is incorrect', 401);
    }
    user.password = req.body.newPassword;
    await user.save();
    ok(res, { message: 'Password updated' });
  } catch (err) { next(err); }
});
