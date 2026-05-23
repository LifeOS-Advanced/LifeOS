import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractBearerToken } from '../utils/jwt';
import { User } from '../models/User';
import { AppError } from '../utils/response';

// Extend Express Request to carry userId
declare global {
  namespace Express {
    interface Request {
      userId: string;
      userEmail: string;
    }
  }
}

export async function protect(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) throw new AppError('No token — please log in', 401, 'NO_TOKEN');

    const payload = verifyAccessToken(token);

    // Verify user still exists in DB
    const user = await User.findById(payload.userId).select('_id email').lean();
    if (!user) throw new AppError('User no longer exists', 401, 'USER_NOT_FOUND');

    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    // JWT errors
    next(new AppError('Invalid or expired token — please log in again', 401, 'INVALID_TOKEN'));
  }
}