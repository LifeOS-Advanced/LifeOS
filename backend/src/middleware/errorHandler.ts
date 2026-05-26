import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/response';

interface ErrorLike {
  name?: string;
  message?: string;
  stack?: string;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message?: string }>;
}

function toErrorLike(err: unknown): ErrorLike {
  return typeof err === 'object' && err !== null ? err as ErrorLike : {};
}

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError('Route not found', 404, 'NOT_FOUND'));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const isDev = process.env.NODE_ENV === 'development';
  const errorLike = toErrorLike(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      ...(isDev && { stack: err.stack }),
    });
  }

  if (isMongoError(err, 11000)) {
    const field = Object.keys(errorLike.keyValue ?? {})[0] ?? 'field';
    return res.status(409).json({
      success: false,
      error: `A record with this ${field} already exists`,
      code: 'DUPLICATE_KEY',
    });
  }

  if (errorLike.name === 'ValidationError') {
    const messages = Object.values(errorLike.errors ?? {}).map((e) => e.message).filter(Boolean);
    return res.status(400).json({
      success: false,
      error: messages.join(', ') || 'Validation failed',
      code: 'VALIDATION_ERROR',
    });
  }

  if (errorLike.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: 'INVALID_ID',
    });
  }

  if (errorLike.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' });
  }

  if (errorLike.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired', code: 'TOKEN_EXPIRED' });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: isDev ? String(err) : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isDev && { stack: errorLike.stack }),
  });
}

function isMongoError(err: unknown, code: number): boolean {
  return toErrorLike(err).code === code;
}
