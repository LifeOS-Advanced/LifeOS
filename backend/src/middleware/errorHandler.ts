import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/response';

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

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      ...(isDev && { stack: err.stack }),
    });
  }

  if (isMongoError(err, 11000)) {
    const field = Object.keys((err as any).keyValue ?? {})[0] ?? 'field';
    return res.status(409).json({
      success: false,
      error: `A record with this ${field} already exists`,
      code: 'DUPLICATE_KEY',
    });
  }

  if ((err as any)?.name === 'ValidationError') {
    const messages = Object.values((err as any).errors).map((e: any) => e.message);
    return res.status(400).json({
      success: false,
      error: messages.join(', '),
      code: 'VALIDATION_ERROR',
    });
  }

  if ((err as any)?.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: 'INVALID_ID',
    });
  }

  if ((err as any)?.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' });
  }

  if ((err as any)?.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired', code: 'TOKEN_EXPIRED' });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: isDev ? String(err) : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isDev && { stack: (err as Error)?.stack }),
  });
}

function isMongoError(err: unknown, code: number): boolean {
  return typeof err === 'object' && err !== null && (err as any).code === code;
}