/**
 * @file authRoutes.js
 * @description Authentication routes with email verification and password reset.
 *
 * Route map:
 *   POST  /api/auth/register              — create account + send verification email
 *   POST  /api/auth/login                  — login and receive JWT
 *   GET   /api/auth/verify-email/:token    — verify email from link
 *   POST  /api/auth/resend-verification    — resend verification email
 *   POST  /api/auth/forgot-password        — request password reset link
 *   POST  /api/auth/reset-password/:token  — reset password with token
 *
 * Rate limiting:
 * - Standard auth limiter on register/login (10 requests per 15 min)
 * - Sensitive auth limiter on forgot-password/resend-verification (5 per hour)
 *   to prevent email spam abuse
 */

import express from "express";
import {
  register,
  login,
  googleLogin,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { authLimiter, sensitiveAuthLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, googleAuthSchema } from "../validators/schemas.js";

const router = express.Router();

// ─── Standard auth routes ─────────────────────────────────────────────────────
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/google", authLimiter, validate(googleAuthSchema), googleLogin);

// ─── Email verification ──────────────────────────────────────────────────────
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", sensitiveAuthLimiter, resendVerification);

// ─── Password reset ──────────────────────────────────────────────────────────
router.post("/forgot-password", sensitiveAuthLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
