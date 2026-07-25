/**
 * @file rateLimiter.js
 * @description Pre-configured rate limiter presets for different route groups.
 *
 * Design decisions:
 * - Different limits for different sensitivity levels:
 *   · Auth endpoints (login/register): stricter — brute-force protection
 *   · Password reset / resend verification: very strict — abuse prevention
 *   · General API: generous — good UX for legitimate users
 * - `standardHeaders: true` — sends RateLimit-* headers (RFC 6585 compliant)
 * - `legacyHeaders: false` — disables deprecated X-RateLimit-* headers
 * - `keyGenerator` uses IP by default — extend to use userId for authenticated routes
 *
 * Note: For production at scale, use Redis as the store:
 *   import RedisStore from 'rate-limit-redis';
 *   store: new RedisStore({ client: redisClient })
 *   (drop-in replacement — no other changes needed)
 */

import rateLimit from "express-rate-limit";

// ─── Helper ───────────────────────────────────────────────────────────────────
const createLimiter = (options) =>
  rateLimit({
    standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
    ...options,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: options.message || "Too many requests. Please try again later.",
      });
    },
  });

// ─── Presets ──────────────────────────────────────────────────────────────────

/**
 * Auth limiter: login, register
 * 10 requests per 15 minutes per IP
 */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

/**
 * Sensitive auth limiter: forgot-password, resend-verification
 * 5 requests per hour per IP — tight limit to prevent email spam
 */
export const sensitiveAuthLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many requests for this action. Please try again in 1 hour.",
});

/**
 * General API limiter: all other authenticated routes
 * 200 requests per 15 minutes per IP
 */
export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests. Please try again in 15 minutes.",
});

/**
 * Admin API limiter: admin-only routes
 * 300 requests per 15 minutes — admins typically make more requests
 */
export const adminLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many admin requests. Please try again in 15 minutes.",
});
