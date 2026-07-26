/**
 * @file User.js
 * @description Extended user schema with email verification and password reset support.
 *
 * Changes from original:
 * - Added `emailVerified` flag — users cannot access protected features until verified
 * - Added `emailVerificationToken` / `emailVerificationExpires` — SHA-256 hashed token + TTL
 * - Added `passwordResetToken` / `passwordResetExpires` — SHA-256 hashed token + 1-hour TTL
 * - Added `lastLoginAt` — audit trail for security monitoring
 *
 * Security note: token fields are excluded from query results by default using `select: false`.
 * They are only fetched when explicitly selected (e.g., User.findOne().select('+emailVerificationToken')).
 * This prevents accidental leakage in API responses.
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ─── Email Verification ────────────────────────────────────────────────
    emailVerified: {
      type: Boolean,
      default: false,
    },

    // SHA-256 hash of the raw token sent in the verification email.
    // `select: false` prevents this from appearing in normal User queries.
    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // ─── Password Reset ────────────────────────────────────────────────────
    // SHA-256 hash of the raw reset token sent in the password reset email.
    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // ─── Audit ────────────────────────────────────────────────────────────
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    // Exclude __v from all responses
    versionKey: false,
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Partial index on token fields — only indexes documents that have them set,
// reducing index size and improving verification lookup performance.
userSchema.index(
  { emailVerificationToken: 1 },
  { sparse: true, name: "email_verification_token_idx" },
);
userSchema.index(
  { passwordResetToken: 1 },
  { sparse: true, name: "password_reset_token_idx" },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
