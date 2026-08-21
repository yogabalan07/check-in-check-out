import rateLimit from 'express-rate-limit';
import { AuthRequest } from '../types';

const limiterMessage = {
  success: false,
  message: 'Too many requests, please try again later',
  errorCode: 'RATE_LIMIT',
};

// OPTIONS preflights are answered by the cors middleware before routing, but
// skip them here as well so browser preflight storms can never burn quota.
const skipPreflight = (req: { method: string }) => req.method === 'OPTIONS';

// Safety net for everything else. Students on college Wi-Fi often share a
// single NAT egress IP, so this cap must stay generous: it only exists to
// stop runaway clients / retry storms, not to throttle the crowd.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10000,
  skip: skipPreflight,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limiterMessage,
});

// Admin login. Kept strict enough to slow brute force, loose enough that
// several admins logging in from the same campus IP are not locked out.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skip: skipPreflight,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limiterMessage,
});

// Public check-in / check-out. Sized for a hackathon burst: hundreds of
// students behind one shared IP each need only a handful of requests.
// 1200 per 15 min per IP ~= sustained 1.3 rps from an entire NAT'd campus,
// which is far above legitimate traffic yet stops accidental retry storms.
export const publicAttendanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1200,
  skip: skipPreflight,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limiterMessage,
});

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2000,
  keyGenerator: (req) => {
    const user = (req as AuthRequest).user;
    return user?.id ? `admin:${user.id}` : req.ip || 'unknown';
  },
  skip: (req) => {
    return !(req as AuthRequest).user;
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limiterMessage,
});
