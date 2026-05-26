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
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
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

// ── POST /api/auth/github ────────────────────────────────────
// Exchanges GitHub OAuth authorization code for app tokens
router.post(
  '/github',
  authLimiter,
  [
    body('code').trim().notEmpty().withMessage('GitHub authorization code required'),
    body('redirectUri').optional().isString().isLength({ max: 500 }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!validate(req, next)) return;
      const { code, redirectUri: bodyRedirectUri } = req.body as { code: string; redirectUri?: string };

      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new AppError('GitHub OAuth is not configured on the server', 503, 'GITHUB_NOT_CONFIGURED');
      }

      const allowedOrigins = (process.env.CLIENT_URL ?? 'http://localhost:8080,http://localhost:5173,http://127.0.0.1:8080,http://127.0.0.1:5173')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      const defaultOrigin = allowedOrigins[0] ?? 'http://localhost:8080';
      const redirectUri =
        bodyRedirectUri ??
        process.env.GITHUB_REDIRECT_URI ??
        `${defaultOrigin}/auth/github/callback`;

      let redirectOrigin: string;
      try {
        redirectOrigin = new URL(redirectUri).origin;
      } catch {
        throw new AppError('Invalid redirect_uri', 400, 'GITHUB_REDIRECT_INVALID');
      }
      const originAllowed = allowedOrigins.some((o) => {
        if (o === redirectOrigin) return true;
        // localhost vs 127.0.0.1 on same port
        try {
          const a = new URL(o);
          const b = new URL(redirectOrigin);
          return a.port === b.port && a.protocol === b.protocol
            && ((a.hostname === 'localhost' && b.hostname === '127.0.0.1')
              || (a.hostname === '127.0.0.1' && b.hostname === 'localhost'));
        } catch {
          return false;
        }
      });
      if (!originAllowed) {
        throw new AppError('redirect_uri origin is not allowed', 400, 'GITHUB_REDIRECT_INVALID');
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = (await tokenRes.json()) as {
        access_token?: string;
        error?: string;
        error_description?: string;
      };

      if (!tokenRes.ok || !tokenData.access_token) {
        throw new AppError(
          tokenData.error_description ?? tokenData.error ?? 'GitHub token exchange failed',
          401,
          'GITHUB_TOKEN_FAILED',
        );
      }

      const ghHeaders = {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'LifeOS',
      };

      const userRes = await fetch('https://api.github.com/user', { headers: ghHeaders });
      if (!userRes.ok) throw new AppError('Failed to fetch GitHub profile', 401, 'GITHUB_USER_FAILED');
      const ghUser = (await userRes.json()) as {
        id: number;
        login: string;
        name: string | null;
        email: string | null;
        avatar_url?: string;
      };

      let email: string | null | undefined = ghUser.email;
      if (!email) {
        const emailsRes = await fetch('https://api.github.com/user/emails', { headers: ghHeaders });
        if (emailsRes.ok) {
          const emails = (await emailsRes.json()) as { email: string; primary: boolean; verified: boolean }[];
          const primary = emails.find(e => e.primary && e.verified) ?? emails.find(e => e.verified);
          email = primary?.email ?? null;
        }
      }
      if (!email) {
        throw new AppError('GitHub account has no public email. Add a verified email on GitHub.', 400, 'GITHUB_NO_EMAIL');
      }

      const providerId = String(ghUser.id);
      let user = await User.findOne({ $or: [{ email }, { provider: 'github', providerId }] });
      if (!user) {
        user = await User.create({
          name: ghUser.name ?? ghUser.login,
          email,
          provider: 'github',
          providerId,
          avatar: ghUser.avatar_url,
        });
      } else {
        user.provider = 'github';
        user.providerId = providerId;
        if (ghUser.avatar_url) user.avatar = ghUser.avatar_url;
        if (!user.name && ghUser.name) user.name = ghUser.name;
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
  },
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