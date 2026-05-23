// ── habits.ts ─────────────────────────────────────────────────
import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { Habit } from '../models/Habit';
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
    const habits = await Habit.find({ userId: req.userId }).sort('-createdAt').lean();
    ok(res, habits);
  } catch (err) { next(err); }
});

router.post('/', [
  body('title').trim().notEmpty().isLength({ max: 120 }),
  body('frequency').optional().isIn(['daily', 'weekly']),
  body('lifeArea').optional().isString(),
  body('goalId').optional().isMongoId(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const habit = await Habit.create({ ...req.body, userId: req.userId, streak: 0, completedDates: [] });
    created(res, habit);
  } catch (err) { next(err); }
});

router.put('/:id', [param('id').isMongoId()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!v(req, next)) return;
      const habit = await Habit.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: req.body }, { new: true, runValidators: true }
      );
      if (!habit) throw new AppError('Habit not found', 404);
      ok(res, habit);
    } catch (err) { next(err); }
  }
);

// Toggle completion for a date
router.patch('/:id/toggle', [
  param('id').isMongoId(),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const { date } = req.body as { date: string };
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) throw new AppError('Habit not found', 404);

    const done = habit.completedDates.includes(date);
    if (done) {
      habit.completedDates = habit.completedDates.filter((d) => d !== date);
      habit.streak = Math.max(0, habit.streak - 1);
    } else {
      habit.completedDates.push(date);
      habit.completedDates.sort();
      habit.streak += 1;
    }
    await habit.save();
    ok(res, habit);
  } catch (err) { next(err); }
});

router.delete('/:id', [param('id').isMongoId()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!v(req, next)) return;
      const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!habit) throw new AppError('Habit not found', 404);
      noContent(res);
    } catch (err) { next(err); }
  }
);

export default router;