import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { Task } from '../models/Task';
import { ok, created, noContent, paginated, AppError } from '../utils/response';
import { recordProgressEvent, ymd } from '../services/progress';

const router = Router();
router.use(protect);

function validate(req: Request, next: NextFunction): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0]?.msg ?? 'Validation failed', 400));
    return false;
  }
  return true;
}

// ── GET /api/tasks ───────────────────────────────────────────
router.get('/', [
  query('status').optional().isIn(['todo', 'in-progress', 'done']),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('group').optional().isIn(['do-first', 'quick-wins', 'schedule', 'maybe-later']),
  query('lifeArea').optional().isString(),
  query('goalId').optional().isMongoId(),
  query('search').optional().isString().isLength({ max: 100 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isIn(['createdAt', '-createdAt', 'dueDate', '-dueDate', 'priority']),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    const { status, priority, group, lifeArea, goalId, search, sort = '-createdAt' } = req.query;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);

    const filter: Record<string, unknown> = { userId: req.userId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (group === 'do-first') Object.assign(filter, { importance: { $gte: 4 }, urgency: { $gte: 4 } });
    if (group === 'quick-wins') Object.assign(filter, { importance: { $gte: 4 }, effort: { $lte: 2 } });
    if (group === 'schedule') Object.assign(filter, { importance: { $gte: 4 }, urgency: { $lte: 2 } });
    if (group === 'maybe-later') Object.assign(filter, { importance: { $lte: 2 } });
    if (lifeArea) filter.lifeArea = lifeArea;
    if (goalId) filter.goalId = goalId;
    if (search) filter.title = { $regex: String(search), $options: 'i' };

    const [items, total] = await Promise.all([
      Task.find(filter).sort(sort as string).skip((page - 1) * limit).limit(limit).lean(),
      Task.countDocuments(filter),
    ]);

    paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
});

// ── GET /api/tasks/:id ───────────────────────────────────────
router.get('/:id', [param('id').isMongoId()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!validate(req, next)) return;
      const task = await Task.findOne({ _id: req.params.id, userId: req.userId }).lean();
      if (!task) throw new AppError('Task not found', 404);
      ok(res, task);
    } catch (err) { next(err); }
  }
);

// ── POST /api/tasks ──────────────────────────────────────────
router.post('/', [
  body('title').trim().notEmpty().isLength({ max: 120 }).withMessage('Title required (max 120)'),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('importance').optional().isInt({ min: 1, max: 5 }),
  body('urgency').optional().isInt({ min: 1, max: 5 }),
  body('effort').optional().isInt({ min: 1, max: 5 }),
  body('energyRequired').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  body('tags').optional().isArray(),
  body('goalId').optional().isMongoId(),
  body('lifeArea').optional().isString(),
  body('subtasks').optional().isArray(),
  body('recurrence').optional().isObject(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    const task = await Task.create({ ...req.body, userId: req.userId });
    created(res, task);
  } catch (err) { next(err); }
});

// ── PUT /api/tasks/:id ───────────────────────────────────────
router.put('/:id', [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty().isLength({ max: 120 }),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('importance').optional().isInt({ min: 1, max: 5 }),
  body('urgency').optional().isInt({ min: 1, max: 5 }),
  body('effort').optional().isInt({ min: 1, max: 5 }),
  body('energyRequired').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  body('tags').optional().isArray(),
  body('goalId').optional().isMongoId(),
  body('lifeArea').optional().isString(),
  body('subtasks').optional().isArray(),
  body('recurrence').optional().isObject(),
],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!validate(req, next)) return;
      const previous = await Task.findOne({ _id: req.params.id, userId: req.userId });
      if (!previous) throw new AppError('Task not found', 404);
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!task) throw new AppError('Task not found', 404);
      if (req.body.status === 'done' && previous.status !== 'done') {
        await recordProgressEvent({
          userId: req.userId,
          type: 'task_completed',
          entityId: String(task._id),
          date: ymd(),
          title: 'Task completed',
          description: task.title,
          metadata: { goalId: task.goalId ? String(task.goalId) : undefined, lifeArea: task.lifeArea },
        });
      }
      ok(res, task);
    } catch (err) { next(err); }
  }
);

// ── PATCH /api/tasks/:id/status ──────────────────────────────
router.patch('/:id/status', [
  param('id').isMongoId(),
  body('status').isIn(['todo', 'in-progress', 'done']),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) throw new AppError('Task not found', 404);
    const previousStatus = task.status;
    task.status = req.body.status;
    await task.save();
    if (task.status === 'done' && previousStatus !== 'done') {
      await recordProgressEvent({
        userId: req.userId,
        type: 'task_completed',
        entityId: String(task._id),
        date: ymd(),
        title: 'Task completed',
        description: task.title,
        metadata: { goalId: task.goalId ? String(task.goalId) : undefined, lifeArea: task.lifeArea },
      });
    }
    ok(res, task);
  } catch (err) { next(err); }
});

// ── PATCH /api/tasks/:id/subtasks/:subId ─────────────────────
router.patch('/:id/subtasks/:subId', [
  param('id').isMongoId(),
  param('subId').isMongoId(),
  body('done').isBoolean(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validate(req, next)) return;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, 'subtasks._id': req.params.subId },
      { $set: { 'subtasks.$.done': req.body.done } },
      { new: true }
    );
    if (!task) throw new AppError('Task or subtask not found', 404);
    ok(res, task);
  } catch (err) { next(err); }
});

// ── DELETE /api/tasks/:id ────────────────────────────────────
router.delete('/:id', [param('id').isMongoId()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!validate(req, next)) return;
      const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!task) throw new AppError('Task not found', 404);
      noContent(res);
    } catch (err) { next(err); }
  }
);

export default router;
