import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import habitRoutes from './routes/habits';
import goalRoutes from './routes/goals';
import noteRoutes from './routes/notes';
import focusRoutes from './routes/focus';
import checkInRoutes from './routes/checkIns';
import reviewRoutes from './routes/reviews';
import profileRoutes from './routes/profile';
import dailyFlowRoutes from './routes/dailyFlows';
import searchRoutes from './routes/search';
import momentumRoutes from './routes/momentum';
import progressRoutes from './routes/progress';
import notificationRoutes from './routes/notifications';
import analyticsRoutes from './routes/analytics';
import narrativeRoutes from './routes/narrative';
import disciplineRoutes from './routes/discipline';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

// ── Security headers ────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CLIENT_URL ?? 'http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim());
const localDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server calls (no origin) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin) || (!isProduction && localDevOrigin.test(origin))) {
        return cb(null, true);
      }
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// ── Logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Global rate limiter ──────────────────────────────────────
app.use(
  '/api',
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — please slow down.' },
  })
);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── API routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/checkins', checkInRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/day-flows', dailyFlowRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/momentum', momentumRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/narrative', narrativeRoutes);
app.use('/api/discipline', disciplineRoutes);

// ── Error handling ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
