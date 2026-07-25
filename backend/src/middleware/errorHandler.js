/**
 * @file errorHandler.js
 * @description Centralized Express error handling middleware.
 *
 * Design decisions:
 * - Single place to handle ALL error types — no scattered try/catch in controllers
 * - Distinguishes operational errors (ApiError) from programmer errors (unexpected)
 * - Transforms framework-specific errors (Mongoose, JWT) into consistent API responses
 * - Never exposes stack traces or internal details to clients in production
 * - Always logs full error details server-side for debugging
 *
 * Express requires error middleware to have exactly 4 arguments: (err, req, res, next)
 */

import logger from "../utils/logger.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Transform known framework errors into ApiError instances.
 * This keeps the response format consistent regardless of where the error originated.
 */
const normalizeError = (err) => {
  // ─── Mongoose Validation Error ───────────────────────────────────────────
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return new ApiError(400, "Validation failed", errors);
  }

  // ─── Mongoose Duplicate Key (e.g., unique email) ─────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue?.[field];
    return new ApiError(409, `${field} '${value}' already exists`);
  }

  // ─── Mongoose Cast Error (invalid ObjectId) ──────────────────────────────
  if (err.name === "CastError") {
    return new ApiError(400, `Invalid value for field '${err.path}'`);
  }

  // ─── JWT Errors ───────────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    return new ApiError(401, "Invalid authentication token");
  }

  if (err.name === "TokenExpiredError") {
    return new ApiError(401, "Authentication token has expired. Please log in again.");
  }

  // ─── Express rate-limit error ─────────────────────────────────────────────
  if (err.status === 429) {
    return new ApiError(429, err.message || "Too many requests. Please try again later.");
  }

  // ─── Pass through existing ApiErrors unchanged ────────────────────────────
  if (err instanceof ApiError) {
    return err;
  }

  // ─── Unknown / programmer error ───────────────────────────────────────────
  return new ApiError(500, "An unexpected error occurred. Please try again.");
};

/**
 * Global Express error handler.
 * Must be registered AFTER all routes in app.js.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const normalizedError = normalizeError(err);

  // ─── Log ─────────────────────────────────────────────────────────────────
  const logPayload = {
    method: req.method,
    url: req.originalUrl,
    statusCode: normalizedError.statusCode,
    message: normalizedError.message,
    errors: normalizedError.errors,
    userId: req.user?.id,
    ip: req.ip,
  };

  // Only programmer errors (5xx) get stack traces in logs
  if (normalizedError.statusCode >= 500) {
    logPayload.stack = err.stack;
    logger.error({ message: "Unhandled server error", ...logPayload });
  } else {
    logger.warn({ message: "Operational error", ...logPayload });
  }

  // ─── Response ─────────────────────────────────────────────────────────────
  return res.status(normalizedError.statusCode).json({
    success: false,
    message: normalizedError.message,
    ...(normalizedError.errors.length > 0 && { errors: normalizedError.errors }),
    // Only include requestId in response if you add request-id middleware later
  });
};
