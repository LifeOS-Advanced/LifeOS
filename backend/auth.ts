import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { rateLimit } from 'express-rate-limit';
import { User } from '../models/User';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ok, created, AppError } from '../utils/response';
import { protect } from '../middleware/auth';

const router = Router();

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { error: 'Too many auth attempts — try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Helpers ──────────────────────────────────────────────────
function validate(req: Request, next: NextFunction): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new AppError(errors.array()[0]?.msg ?? 'Validation failed', 400, 'VALIDATION_ERROR'));
    return false;
  }
  return true;
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/api/auth',
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie('refreshToken', { path: '/api/auth' });
}

// ── POST /api/auth/register ──────────────────────────────────
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
    body('email').trim().isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!validate(req, next)) return;
      const { name, email, password } = req.body as { name: string; email: string; password: string };

      const existing = await User.findOne({ email });
      if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');

      const user = await User.create({ name, email, password, provider: 'local' });
      const accessToken = signAccessToken(user._id, user.email);
      const refreshToken = signRefreshToken(user._id, user.email);

      // Persist refresh token
      await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });
      setRefreshCookie(res, refreshToken);

      created(res, { accessToken, user });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/login ─────────────────────────────────────
router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!validate(req, next)) return;
      const { email, password } = req.body as { email: string; password: string };

      const user = await User.findOne({ email }).select('+password +refreshTokens');
      if (!user || !(await user.comparePassword(password))) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      const accessToken = signAccessToken(user._id, user.email);
      const refreshToken = signRefreshToken(user._id, user.email);

      // Rotate — remove old tokens if more than 5 stored
      const tokens = [...(user.refreshTokens ?? []).slice(-4), refreshToken];
      await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: tokens } });
      setRefreshCookie(res, refreshToken);

      ok(res, { accessToken, user });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/google ────────────────────────────────────
// Receives Google access token from @react-oauth/google, fetches user info
router.post(
  '/google',
  authLimiter,
  [body('accessToken').notEmpty().withMessage('Google access token required')],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!validate(req, next)) return;
      const { accessToken: googleToken } = req.body as { accessToken: string };

      // Verify token by fetching user info from Google
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleToken}` },
      });
      if (!googleRes.ok) throw new AppError('Invalid Google token', 401, 'INVALID_GOOGLE_TOKEN');

      const googleUser = (await googleRes.json()) as {
        sub: string; email: string; name: string; picture?: string;
      };

      // Upsert user
      let user = await User.findOne({ email: googleUser.email });
      if (!user) {
        user = await User.create({
          name: googleUser.name,
          email: googleUser.email,
          provider: 'google',
          providerId: googleUser.sub,
          avatar: googleUser.picture,
        });
      } else if (user.provider !== 'google') {
        // Account exists with different provider — link
        user.provider = 'google';
        user.providerId = googleUser.sub;
        if (googleUser.picture) user.avatar = googleUser.picture;
        await user.save();
      }

      const accessToken = signAccessToken(user._id, user.email);
      const refreshToken = signRefreshToken(user._id, user.email);
      await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });
      setRefreshCookie(res, refreshToken);

      ok(res, { accessToken, user });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/refresh ───────────────────────────────────
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) throw new AppError('No refresh token', 401, 'NO_REFRESH_TOKEN');

    const payload = verifyRefreshToken(token);

    // Check token is in the stored list
    const user = await User.findById(payload.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(token)) {
      clearRefreshCookie(res);
      throw new AppError('Refresh token revoked', 401, 'REFRESH_REVOKED');
    }

    const newAccess = signAccessToken(user._id, user.email);
    const newRefresh = signRefreshToken(user._id, user.email);

    // Rotate refresh token
    const tokens = user.refreshTokens.filter((t) => t !== token);
    tokens.push(newRefresh);
    await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: tokens.slice(-5) } });
    setRefreshCookie(res, newRefresh);

    ok(res, { accessToken: newAccess });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (token) {
      await User.findByIdAndUpdate(req.userId, { $pull: { refreshTokens: token } });
    }
    clearRefreshCookie(res);
    ok(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError('User not found', 404);
    ok(res, { user });
  } catch (err) {
    next(err);
  }
});

export default router;