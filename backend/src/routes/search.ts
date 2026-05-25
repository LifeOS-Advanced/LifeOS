import { Router, Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { Task } from '../models/Task';
import { Habit } from '../models/Habit';
import { Goal } from '../models/Goal';
import { Note, WeeklyReview } from '../models/Index';
import { ok, AppError } from '../utils/response';

const router = Router();
router.use(protect);

function v(req: Request, next: NextFunction) {
  const e = validationResult(req);
  if (!e.isEmpty()) {
    next(new AppError(e.array()[0]?.msg ?? 'Validation failed', 400));
    return false;
  }
  return true;
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const preview = (value?: string) => (value ?? '').replace(/<[^>]*>/g, '').slice(0, 140);

router.get('/', [
  query('q').trim().isLength({ min: 1, max: 100 }),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const q = String(req.query.q);
    const rx = new RegExp(escapeRegex(q), 'i');
    const userId = req.userId;
    const limit = 6;

    const [tasks, habits, goals, notes, reviews] = await Promise.all([
      Task.find({ userId, $or: [{ title: rx }, { description: rx }, { tags: rx }] }).sort('-updatedAt').limit(limit).lean(),
      Habit.find({ userId, $or: [{ title: rx }, { description: rx }] }).sort('-updatedAt').limit(limit).lean(),
      Goal.find({ userId, $or: [{ title: rx }, { description: rx }] }).sort('-updatedAt').limit(limit).lean(),
      Note.find({ userId, $or: [{ title: rx }, { content: rx }, { tags: rx }] }).sort({ pinned: -1, updatedAt: -1 }).limit(limit).lean(),
      WeeklyReview.find({ userId, $or: [{ wentWell: rx }, { gotIgnored: rx }, { improveNext: rx }] }).sort('-weekStart').limit(limit).lean(),
    ]);

    ok(res, {
      task: tasks.map(t => ({ id: String(t._id), type: 'task', title: t.title, snippet: preview(t.description), route: '/app/tasks' })),
      habit: habits.map(h => ({ id: String(h._id), type: 'habit', title: h.title, snippet: preview(h.description), route: '/app/habits' })),
      goal: goals.map(g => ({ id: String(g._id), type: 'goal', title: g.title, snippet: preview(g.description), route: '/app/goals' })),
      note: notes.map(n => ({ id: String(n._id), type: 'note', title: n.title, snippet: preview(n.content), route: '/app/notes' })),
      review: reviews.map(r => ({ id: String(r._id), type: 'review', title: `Week of ${r.weekStart}`, snippet: preview(`${r.wentWell} ${r.improveNext}`), route: '/app/review' })),
    });
  } catch (err) { next(err); }
});

export default router;
