import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { protect } from '../middleware/auth';
import { DisciplineTarget, ReplacementAction, UrgeLog } from '../models/Discipline';
import { ok, created, noContent, AppError } from '../utils/response';
import { recordProgressEvent, ymd } from '../services/progress';

const router = Router();
router.use(protect);

const outcomeValues = ['interrupted', 'delayed', 'relapsed'];
const targetStatusValues = ['active', 'paused', 'archived'];
const replacementCategories = ['body', 'breathing', 'environment', 'reflection', 'focus', 'social', 'custom'];

function validate(req: Request, next: NextFunction): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0]?.msg ?? 'Validation failed', 400));
    return false;
  }
  return true;
}

function compact<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== '')
  ) as Partial<T>;
}

async function assertOwnedTarget(userId: string, targetId?: string) {
  if (!targetId) return;
  const exists = await DisciplineTarget.exists({ _id: targetId, userId });
  if (!exists) throw new AppError('Discipline target not found', 404);
}

async function assertOwnedReplacement(userId: string, replacementId?: string) {
  if (!replacementId) return;
  const exists = await ReplacementAction.exists({ _id: replacementId, userId });
  if (!exists) throw new AppError('Replacement action not found', 404);
}

async function maybeRewardUrge(userId: string, urge: { _id: Types.ObjectId; outcome: string; replacementCompleted?: boolean; trigger?: string }) {
  if (urge.outcome !== 'interrupted') return undefined;
  return recordProgressEvent({
    userId,
    type: 'urge_interrupted',
    entityId: String(urge._id),
    date: ymd(),
    title: 'Urge interrupted',
    description: urge.trigger,
    metadata: { key: `urge_interrupted:${urge._id}`, trigger: urge.trigger },
  });
}

async function maybeRewardReplacement(userId: string, urge: { _id: Types.ObjectId; replacementCompleted?: boolean; replacementActionId?: Types.ObjectId }) {
  if (!urge.replacementCompleted) return undefined;
  return recordProgressEvent({
    userId,
    type: 'replacement_completed',
    entityId: String(urge._id),
    date: ymd(),
    title: 'Replacement action completed',
    metadata: {
      key: `replacement_completed:${urge._id}`,
      replacementActionId: urge.replacementActionId ? String(urge.replacementActionId) : undefined,
    },
  });
}

router.get('/targets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targets = await DisciplineTarget.find({ userId: req.userId }).sort('-createdAt').lean();
    ok(res, targets);
  } catch (err) { next(err); }
});

router.post('/targets', [
  body('name').trim().notEmpty().isLength({ max: 120 }).withMessage('Target name required'),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('identityStatement').optional().isString().isLength({ max: 240 }),
  body('status').optional().isIn(targetStatusValues),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    const target = await DisciplineTarget.create({
      userId: req.userId,
      name: req.body.name,
      description: req.body.description,
      identityStatement: req.body.identityStatement,
      status: req.body.status ?? 'active',
    });
    created(res, target);
  } catch (err) { next(err); }
});

router.patch('/targets/:id', [
  param('id').isMongoId(),
  body('name').optional().trim().notEmpty().isLength({ max: 120 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('identityStatement').optional().isString().isLength({ max: 240 }),
  body('status').optional().isIn(targetStatusValues),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    const target = await DisciplineTarget.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: compact({
        name: req.body.name,
        description: req.body.description,
        identityStatement: req.body.identityStatement,
        status: req.body.status,
      }) },
      { new: true, runValidators: true }
    );
    if (!target) throw new AppError('Discipline target not found', 404);
    ok(res, target);
  } catch (err) { next(err); }
});

router.delete('/targets/:id', [param('id').isMongoId()], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    const target = await DisciplineTarget.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!target) throw new AppError('Discipline target not found', 404);
    await Promise.all([
      ReplacementAction.updateMany({ userId: req.userId, targetId: req.params.id }, { $unset: { targetId: '' } }),
      UrgeLog.updateMany({ userId: req.userId, targetId: req.params.id }, { $unset: { targetId: '' } }),
    ]);
    noContent(res);
  } catch (err) { next(err); }
});

router.get('/replacements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const replacements = await ReplacementAction.find({ userId: req.userId }).sort('-isDefault -createdAt').lean();
    ok(res, replacements);
  } catch (err) { next(err); }
});

router.post('/replacements', [
  body('title').trim().notEmpty().isLength({ max: 120 }).withMessage('Replacement title required'),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('category').optional().isIn(replacementCategories),
  body('durationMinutes').optional().isInt({ min: 1, max: 120 }).toInt(),
  body('targetId').optional().isMongoId(),
  body('isDefault').optional().isBoolean(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    await assertOwnedTarget(req.userId, req.body.targetId);
    const replacement = await ReplacementAction.create({
      userId: req.userId,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category ?? 'custom',
      durationMinutes: req.body.durationMinutes ?? 2,
      targetId: req.body.targetId,
      isDefault: req.body.isDefault ?? false,
    });
    created(res, replacement);
  } catch (err) { next(err); }
});

router.patch('/replacements/:id', [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty().isLength({ max: 120 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('category').optional().isIn(replacementCategories),
  body('durationMinutes').optional().isInt({ min: 1, max: 120 }).toInt(),
  body('targetId').optional().isMongoId(),
  body('isDefault').optional().isBoolean(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    await assertOwnedTarget(req.userId, req.body.targetId);
    const replacement = await ReplacementAction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: compact({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        durationMinutes: req.body.durationMinutes,
        targetId: req.body.targetId,
        isDefault: req.body.isDefault,
      }) },
      { new: true, runValidators: true }
    );
    if (!replacement) throw new AppError('Replacement action not found', 404);
    ok(res, replacement);
  } catch (err) { next(err); }
});

router.delete('/replacements/:id', [param('id').isMongoId()], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    const replacement = await ReplacementAction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!replacement) throw new AppError('Replacement action not found', 404);
    await UrgeLog.updateMany({ userId: req.userId, replacementActionId: req.params.id }, { $unset: { replacementActionId: '' } });
    noContent(res);
  } catch (err) { next(err); }
});

router.get('/urges', [
  query('outcome').optional().isIn(outcomeValues),
  query('targetId').optional().isMongoId(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    const filter: Record<string, unknown> = { userId: req.userId };
    if (req.query.outcome) filter.outcome = req.query.outcome;
    if (req.query.targetId) filter.targetId = req.query.targetId;
    const limit = Number(req.query.limit ?? 50);
    const urges = await UrgeLog.find(filter).sort('-occurredAt').limit(limit).lean();
    ok(res, urges);
  } catch (err) { next(err); }
});

router.post('/urges', [
  body('targetId').optional().isMongoId(),
  body('replacementActionId').optional().isMongoId(),
  body('intensity').isInt({ min: 1, max: 10 }).toInt(),
  body('trigger').trim().notEmpty().isLength({ max: 80 }),
  body('emotion').trim().notEmpty().isLength({ max: 80 }),
  body('context').optional().isString().isLength({ max: 160 }),
  body('location').optional().isString().isLength({ max: 120 }),
  body('outcome').isIn(outcomeValues),
  body('replacementCompleted').optional().isBoolean(),
  body('notes').optional().isString().isLength({ max: 2000 }),
  body('occurredAt').optional().isISO8601(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    await Promise.all([
      assertOwnedTarget(req.userId, req.body.targetId),
      assertOwnedReplacement(req.userId, req.body.replacementActionId),
    ]);
    const urge = await UrgeLog.create({
      userId: req.userId,
      targetId: req.body.targetId,
      replacementActionId: req.body.replacementActionId,
      intensity: req.body.intensity,
      trigger: req.body.trigger,
      emotion: req.body.emotion,
      context: req.body.context,
      location: req.body.location,
      outcome: req.body.outcome,
      replacementCompleted: req.body.replacementCompleted ?? false,
      notes: req.body.notes,
      occurredAt: req.body.occurredAt ? new Date(req.body.occurredAt) : new Date(),
    });
    const progress = await maybeRewardUrge(req.userId, urge);
    const replacementProgress = await maybeRewardReplacement(req.userId, urge);
    created(res, { urge, progress: replacementProgress ?? progress, replacementProgress });
  } catch (err) { next(err); }
});

router.patch('/urges/:id', [
  param('id').isMongoId(),
  body('targetId').optional().isMongoId(),
  body('replacementActionId').optional().isMongoId(),
  body('intensity').optional().isInt({ min: 1, max: 10 }).toInt(),
  body('trigger').optional().trim().notEmpty().isLength({ max: 80 }),
  body('emotion').optional().trim().notEmpty().isLength({ max: 80 }),
  body('context').optional().isString().isLength({ max: 160 }),
  body('location').optional().isString().isLength({ max: 120 }),
  body('outcome').optional().isIn(outcomeValues),
  body('replacementCompleted').optional().isBoolean(),
  body('notes').optional().isString().isLength({ max: 2000 }),
  body('review').optional().isObject(),
  body('review.whatHappened').optional().isString().isLength({ max: 2000 }),
  body('review.whatTriggered').optional().isString().isLength({ max: 1000 }),
  body('review.nextChange').optional().isString().isLength({ max: 1000 }),
  body('review.nextReplacementActionId').optional().isMongoId(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    await Promise.all([
      assertOwnedTarget(req.userId, req.body.targetId),
      assertOwnedReplacement(req.userId, req.body.replacementActionId),
      assertOwnedReplacement(req.userId, req.body.review?.nextReplacementActionId),
    ]);
    const urge = await UrgeLog.findOne({ _id: req.params.id, userId: req.userId });
    if (!urge) throw new AppError('Urge log not found', 404);
    const hadReplacementCompleted = urge.replacementCompleted;
    const hadReview = Boolean(urge.review?.reviewedAt);

    const updates = compact({
      targetId: req.body.targetId,
      replacementActionId: req.body.replacementActionId,
      intensity: req.body.intensity,
      trigger: req.body.trigger,
      emotion: req.body.emotion,
      context: req.body.context,
      location: req.body.location,
      outcome: req.body.outcome,
      replacementCompleted: req.body.replacementCompleted,
      notes: req.body.notes,
    });
    Object.assign(urge, updates);

    if (req.body.review) {
      if (urge.outcome !== 'relapsed') throw new AppError('Relapse review can only be attached to a relapsed urge', 400);
      urge.review = {
        whatHappened: req.body.review.whatHappened,
        whatTriggered: req.body.review.whatTriggered,
        nextChange: req.body.review.nextChange,
        nextReplacementActionId: req.body.review.nextReplacementActionId,
        reviewedAt: new Date(),
      };
    }

    await urge.save();
    const replacementProgress = !hadReplacementCompleted && urge.replacementCompleted
      ? await maybeRewardReplacement(req.userId, urge)
      : undefined;
    const reviewProgress = !hadReview && urge.review?.reviewedAt ? await recordProgressEvent({
        userId: req.userId,
        type: 'relapse_reviewed',
        entityId: String(urge._id),
        date: ymd(),
        title: 'Relapse review completed',
        description: urge.trigger,
        metadata: { key: `relapse_reviewed:${urge._id}`, trigger: urge.trigger },
      }) : undefined;
    ok(res, { urge, progress: reviewProgress ?? replacementProgress });
  } catch (err) { next(err); }
});

router.get('/insights', [
  query('periodDays').optional().isInt({ min: 7, max: 365 }).toInt(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    const periodDays = Number(req.query.periodDays ?? 30);
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - periodDays + 1);
    since.setUTCHours(0, 0, 0, 0);
    const urges = await UrgeLog.find({ userId: req.userId, occurredAt: { $gte: since } }).sort('-occurredAt').lean();

    const tally = (field: 'trigger' | 'emotion' | 'context') => {
      const counts = new Map<string, number>();
      urges.forEach((urge) => {
        const label = String(urge[field] ?? '').trim();
        if (!label) return;
        counts.set(label, (counts.get(label) ?? 0) + 1);
      });
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, count]) => ({ label, count }));
    };

    const hourCounts = new Map<number, number>();
    urges.forEach((urge) => {
      const hour = new Date(urge.occurredAt).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    });

    const totalIntensity = urges.reduce((sum, urge) => sum + Number(urge.intensity ?? 0), 0);
    const insights = {
      periodDays,
      totalUrges: urges.length,
      interruptedCount: urges.filter((urge) => urge.outcome === 'interrupted').length,
      delayedCount: urges.filter((urge) => urge.outcome === 'delayed').length,
      relapseCount: urges.filter((urge) => urge.outcome === 'relapsed').length,
      replacementCompletedCount: urges.filter((urge) => urge.replacementCompleted).length,
      averageIntensity: urges.length ? Math.round((totalIntensity / urges.length) * 10) / 10 : 0,
      topTriggers: tally('trigger'),
      topEmotions: tally('emotion'),
      topContexts: tally('context'),
      highRiskHours: [...hourCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([hour, count]) => ({ hour, count })),
      recentUrges: urges.slice(0, 5),
    };

    ok(res, insights);
  } catch (err) { next(err); }
});

export default router;
