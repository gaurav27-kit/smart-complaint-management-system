/**
 * @file authController.js
 * @description Authentication controller with complete email verification and password reset.
 *
 * Improvements over original:
 * - asyncHandler replaces manual try/catch in every function
 * - ApiError provides typed, consistent error responses
 * - Email verification flow: register → verify email → welcome
 * - Password reset flow: forgot → reset link email → change → success email
 * - Tokens are SHA-256 hashed before storage (raw token only lives in email URL)
 * - lastLoginAt timestamp updated on every successful login
 * - Emails are fired asynchronously — responses are never delayed by email delivery
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashToken,
} from "../utils/tokenUtils.js";
import { notificationService } from "../notifications/services/NotificationService.js";
import logger from "../utils/logger.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate a signed JWT for the given user payload.
 * Expires in 7 days (configurable via JWT_EXPIRES_IN env var).
 */
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/**
 * Build the safe user object returned in all auth responses.
 * Never include password, token fields, or internal fields.
 */
const buildUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
});

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Register a new user and send email verification
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  logger.info({ message: "[Auth] Register attempt", email });

  // ─── Validation ───────────────────────────────────────────────────────────
  if (!fullName?.trim() || !email?.trim() || !password) {
    throw ApiError.badRequest("All fields are required: fullName, email, password");
  }

  if (password.length < 6) {
    throw ApiError.badRequest("Password must be at least 6 characters");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ─── Duplicate check ──────────────────────────────────────────────────────
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict("An account with this email already exists");
  }

  // ─── Create user ──────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(password, 12); // 12 rounds — OWASP recommended

  // Generate email verification token
  const { rawToken, hashedToken, expiresAt } = generateEmailVerificationToken();

  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    emailVerificationToken: hashedToken,
    emailVerificationExpires: expiresAt,
  });

  logger.info({ message: "[Auth] User created", userId: user._id, email: normalizedEmail });

  // ─── Send verification email (non-blocking) ───────────────────────────────
  // We pass rawToken — it's embedded in the email URL. Only hashedToken is stored.
  notificationService.sendEmailVerification(user, rawToken).catch((err) =>
    logger.error({ message: "[Auth] Failed to send verification email", error: err.message }),
  );

  res.status(201).json({
    success: true,
    message: "Account created. Please check your email to verify your account.",
    user: buildUserResponse(user),
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFY EMAIL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Verify email with token from email link
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw ApiError.badRequest("Verification token is required");
  }

  // Hash the incoming raw token to match what's stored in DB
  const hashedToken = hashToken(token);

  // Select the hidden token fields explicitly
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw ApiError.badRequest(
      "Invalid or expired verification link. Please request a new verification email.",
    );
  }

  if (user.emailVerified) {
    return res.status(200).json({
      success: true,
      message: "Email is already verified. You can log in.",
    });
  }

  // ─── Mark verified, clear token ───────────────────────────────────────────
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  logger.info({ message: "[Auth] Email verified", userId: user._id });

  // ─── Send welcome email (non-blocking) ────────────────────────────────────
  notificationService.sendWelcomeEmail(user).catch((err) =>
    logger.error({ message: "[Auth] Failed to send welcome email", error: err.message }),
  );

  res.status(200).json({
    success: true,
    message: "Email verified successfully. Welcome to SCMS!",
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESEND VERIFICATION EMAIL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Resend verification email for unverified accounts
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    throw ApiError.badRequest("Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+emailVerificationToken +emailVerificationExpires",
  );

  // Security: always return success to prevent email enumeration attacks
  const successResponse = {
    success: true,
    message: "If an unverified account exists for this email, a new verification link has been sent.",
  };

  if (!user || user.emailVerified) {
    return res.status(200).json(successResponse);
  }

  // Generate a new token (invalidates the old one)
  const { rawToken, hashedToken, expiresAt } = generateEmailVerificationToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = expiresAt;
  await user.save();

  notificationService.sendEmailVerification(user, rawToken).catch((err) =>
    logger.error({ message: "[Auth] Failed to resend verification email", error: err.message }),
  );

  res.status(200).json(successResponse);
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Login user and return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    throw ApiError.badRequest("Email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  logger.info({ message: "[Auth] Login attempt", email: normalizedEmail });

  // Fetch user with password (excluded by default in schema)
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  // Generic message prevents email enumeration
  const invalidCredentials = ApiError.badRequest("Invalid email or password");

  if (!user) throw invalidCredentials;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw invalidCredentials;

  // Update last login timestamp (don't await — non-critical)
  User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).catch(() => {});

  const token = signToken({ id: user._id, role: user.role });

  logger.info({ message: "[Auth] Login successful", userId: user._id });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: buildUserResponse(user),
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Request a password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    throw ApiError.badRequest("Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+passwordResetToken +passwordResetExpires",
  );

  // Always return success — prevents email enumeration
  const successResponse = {
    success: true,
    message: "If an account exists for this email, a password reset link has been sent.",
  };

  if (!user) {
    return res.status(200).json(successResponse);
  }

  // Generate reset token (1-hour TTL)
  const { rawToken, hashedToken, expiresAt } = generatePasswordResetToken();

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = expiresAt;
  await user.save();

  notificationService.sendForgotPassword(user, rawToken).catch((err) =>
    logger.error({ message: "[Auth] Failed to send forgot-password email", error: err.message }),
  );

  logger.info({ message: "[Auth] Password reset token issued", userId: user._id });

  res.status(200).json(successResponse);
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESET PASSWORD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Reset password using token from email link
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!token) throw ApiError.badRequest("Reset token is required");
  if (!password || !confirmPassword) throw ApiError.badRequest("Password and confirmation are required");
  if (password !== confirmPassword) throw ApiError.badRequest("Passwords do not match");
  if (password.length < 6) throw ApiError.badRequest("Password must be at least 6 characters");

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires +password");

  if (!user) {
    throw ApiError.badRequest(
      "Invalid or expired reset link. Please request a new password reset.",
    );
  }

  // ─── Update password ──────────────────────────────────────────────────────
  user.password = await bcrypt.hash(password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info({ message: "[Auth] Password reset successfully", userId: user._id });

  // ─── Send confirmation email (non-blocking) ───────────────────────────────
  notificationService.sendPasswordResetSuccess(user).catch((err) =>
    logger.error({ message: "[Auth] Failed to send password-reset-success email", error: err.message }),
  );

  res.status(200).json({
    success: true,
    message: "Password reset successfully. You can now log in with your new password.",
  });
});
