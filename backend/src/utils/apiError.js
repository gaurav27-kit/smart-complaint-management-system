/**
 * @file apiError.js
 * @description Custom error class for operational API errors.
 *
 * Design decisions:
 * - Extends native Error → full stack trace support
 * - Carries `statusCode` so the error handler can set the HTTP response correctly
 * - `isOperational` flag separates user-facing errors from unexpected programmer errors
 *   → operational errors get descriptive messages; others get a generic 500
 * - `errors` array supports field-level validation error details (e.g., from Joi/Mongoose)
 */

export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 500…)
   * @param {string} message - Human-readable error message (safe to expose to clients)
   * @param {Array}  errors - Optional array of granular error details
   * @param {string} stack - Optional pre-captured stack trace
   */
  constructor(statusCode, message, errors = [], stack = "") {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = errors;

    // Mark as operational so the global handler knows this is expected behavior,
    // not an unhandled programmer error that should trigger alerts/restarts.
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // ─── Convenience factory methods ──────────────────────────────────────────

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = "Too many requests. Please try again later.") {
    return new ApiError(429, message);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
}
