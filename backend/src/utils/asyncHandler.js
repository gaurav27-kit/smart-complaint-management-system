/**
 * @file asyncHandler.js
 * @description Higher-order function that wraps async Express route handlers.
 *
 * Design decisions:
 * - Eliminates repetitive try/catch blocks in every controller
 * - Forwards errors to Express's global error handler via next(err)
 * - Works with any async function that follows (req, res, next) signature
 * - Compatible with Express 5 (which auto-catches async errors, but this
 *   works across Express 4 too for maximum compatibility)
 *
 * Usage:
 *   export const myController = asyncHandler(async (req, res) => {
 *     // throw ApiError or any Error — asyncHandler forwards it to errorHandler.js
 *   });
 */

/**
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  // Promise.resolve() normalizes both sync throws and async rejections
  Promise.resolve(fn(req, res, next)).catch(next);
};
