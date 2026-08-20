import rateLimit from 'express-rate-limit';
import { AuthRequest } from '../types';

const limiterMessage = {
  success: false,
  message: 'Too many requests, please try again later',
  errorCode: 'RATE_LIMIT',
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3000,
  message: limiterMessage,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: limiterMessage,
});

export const publicAttendanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: limiterMessage,
});

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  keyGenerator: (req) => {
    const user = (req as AuthRequest).user;
    return user?.id ? `admin:${user.id}` : req.ip || 'unknown';
  },
  skip: (req) => {
    return !(req as AuthRequest).user;
  },
  message: limiterMessage,
});