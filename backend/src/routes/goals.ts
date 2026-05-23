import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { Goal } from '../models/Goal';
import { ok, created, noContent, AppError } from '../utils/response';

const router = Router();
router.use(protect);

function v(req: Request, next: NextFunction) {
  const e = validationResult(req);
  if (!e.isEmpty()) { next(new AppError(e.array()[0]?.msg ?? 'Validation failed', 400)); return false; }
  return true;
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goals = await Goal.find({ userId: req.userId }).sort('-createdAt').lean();
    ok(res, goals);
  } catch (err) { next(err); }
});

router.get('/:id', [param('id').isMongoId()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!v(req, next)) return;
      const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId }).lean();
      if (!goal) throw new AppError('Goal not found', 404);
      ok(res, goal);
    } catch (err) { next(err); }
  }
);

router.post('/', [
  body('title').trim().notEmpty().isLength({ max: 120 }),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('targetDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  body('lifeArea').optional().isString(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const goal = await Goal.create({
      ...req.body,
      userId: req.userId,
      progress: 0,
      milestones: [],
      linkedTaskIds: [],
      linkedHabitIds: [],
      linkedNoteIds: [],
    });
    created(res, goal);
  } catch (err) { next(err); }
});

router.put('/:id', [param('id').isMongoId()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!v(req, next)) return;
      const goal = await Goal.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: req.body }, { new: true, runValidators: true }
      );
      if (!goal) throw new AppError('Goal not found', 404);
      ok(res, goal);
    } catch (err) { next(err); }
  }
);

// Toggle milestone
router.patch('/:id/milestones/:mId/toggle', [
  param('id').isMongoId(), param('mId').isMongoId(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) throw new AppError('Goal not found', 404);

    const ms = (goal.milestones as any).id(req.params.mId);
    if (!ms) throw new AppError('Milestone not found', 404);
    ms.completed = !ms.completed;

    // Recalculate progress
    const done = goal.milestones.filter((m) => m.completed).length;
    goal.progress = goal.milestones.length ? Math.round((done / goal.milestones.length) * 100) : 0;
    await goal.save();
    ok(res, goal);
  } catch (err) { next(err); }
});

// Add milestone
router.post('/:id/milestones', [
  param('id').isMongoId(),
  body('title').trim().notEmpty().isLength({ max: 200 }),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) throw new AppError('Goal not found', 404);
    goal.milestones.push({ title: req.body.title, completed: false } as any);
    await goal.save();
    ok(res, goal);
  } catch (err) { next(err); }
});

router.delete('/:id', [param('id').isMongoId()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!v(req, next)) return;
      const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!goal) throw new AppError('Goal not found', 404);
      noContent(res);
    } catch (err) { next(err); }
  }
);

export default router;