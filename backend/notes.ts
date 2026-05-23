import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { protect } from '../middleware/auth';
import { Note } from '../models/index';
import { ok, created, noContent, AppError } from '../utils/response';

const router = Router();
router.use(protect);

function v(req: Request, next: NextFunction) {
  const e = validationResult(req);
  if (!e.isEmpty()) { next(new AppError(e.array()[0]?.msg ?? 'Validation failed', 400)); return false; }
  return true;
}

router.get('/', [
  query('search').optional().isString().isLength({ max: 100 }),
  query('folder').optional().isString(),
  query('pinned').optional().isBoolean().toBoolean(),
  query('lifeArea').optional().isString(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const { search, folder, pinned, lifeArea } = req.query;

    const filter: Record<string, unknown> = { userId: req.userId };
    if (folder) filter.folder = folder;
    if (pinned !== undefined) filter.pinned = pinned;
    if (lifeArea) filter.lifeArea = lifeArea;
    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { content: { $regex: String(search), $options: 'i' } },
      ];
    }

    const notes = await Note.find(filter).sort({ pinned: -1, updatedAt: -1 }).lean();
    ok(res, notes);
  } catch (err) { next(err); }
});

router.get('/:id', [param('id').isMongoId()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!v(req, next)) return;
      const note = await Note.findOne({ _id: req.params.id, userId: req.userId }).lean();
      if (!note) throw new AppError('Note not found', 404);
      ok(res, note);
    } catch (err) { next(err); }
  }
);

router.post('/', [
  body('title').trim().notEmpty().isLength({ max: 160 }),
  body('content').optional().isString().isLength({ max: 50000 }),
  body('tags').optional().isArray(),
  body('folder').optional().isString().isLength({ max: 60 }),
  body('pinned').optional().isBoolean(),
  body('lifeArea').optional().isString(),
  body('goalId').optional().isMongoId(),
  body('taskId').optional().isMongoId(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!v(req, next)) return;
    const note = await Note.create({ ...req.body, userId: req.userId });
    created(res, note);
  } catch (err) { next(err); }
});

router.put('/:id', [param('id').isMongoId()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!v(req, next)) return;
      const note = await Note.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: req.body }, { new: true, runValidators: true }
      );
      if (!note) throw new AppError('Note not found', 404);
      ok(res, note);
    } catch (err) { next(err); }
  }
);

router.patch('/:id/pin', [param('id').isMongoId()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!v(req, next)) return;
      const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
      if (!note) throw new AppError('Note not found', 404);
      note.pinned = !note.pinned;
      await note.save();
      ok(res, note);
    } catch (err) { next(err); }
  }
);

router.delete('/:id', [param('id').isMongoId()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!v(req, next)) return;
      const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!note) throw new AppError('Note not found', 404);
      noContent(res);
    } catch (err) { next(err); }
  }
);

export default router;