/**
 * @file tokenUtils.js
 * @description Secure token generation and verification for auth flows.
 *
 * Security model:
 * - `rawToken` (32 random bytes as hex) is ONLY sent in the email link — never stored in DB
 * - `hashedToken` (SHA-256 of rawToken) is stored in MongoDB
 * - On verification: incoming rawToken is hashed and compared to stored hash
 *
 * Why SHA-256?
 * - bcrypt is inappropriate for tokens (tokens are already high entropy; bcrypt adds cost
 *   but tokens aren't susceptible to dictionary attacks like passwords)
 * - SHA-256 is fast and deterministic — needed for comparison without storing the raw value
 * - Even if the DB is breached, raw tokens remain unknown to the attacker
 *
 * Token entropy: 32 bytes = 256 bits — computationally infeasible to brute-force
 */

import crypto from "crypto";

/**
 * Generate a cryptographically secure random token with its SHA-256 hash.
 *
 * @returns {{ rawToken: string, hashedToken: string, expiresAt: Date }}
 */
export const generateEmailVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  // Verification tokens are valid for 24 hours
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return { rawToken, hashedToken, expiresAt };
};

/**
 * Generate a password-reset token with a shorter TTL.
 *
 * @returns {{ rawToken: string, hashedToken: string, expiresAt: Date }}
 */
export const generatePasswordResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  // Password reset tokens are valid for 1 hour only — tighter security window
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  return { rawToken, hashedToken, expiresAt };
};

/**
 * Hash a raw token using SHA-256.
 * Used both when storing tokens and when verifying incoming tokens.
 *
 * @param {string} rawToken
 * @returns {string} hex-encoded SHA-256 hash
 */
export const hashToken = (rawToken) => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

/**
 * Constant-time comparison of two hashed tokens.
 * Prevents timing attacks when comparing secrets.
 *
 * @param {string} hash1
 * @param {string} hash2
 * @returns {boolean}
 */
export const safeCompare = (hash1, hash2) => {
  if (!hash1 || !hash2) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(hash1), Buffer.from(hash2));
  } catch {
    return false;
  }
};
