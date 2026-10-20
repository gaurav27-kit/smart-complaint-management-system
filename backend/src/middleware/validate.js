/**
 * @file validate.js
 * @description Reusable request body validation middleware using Zod schemas.
 */

import { ApiError } from "../utils/apiError.js";

/**
 * Validates request body against a Zod schema.
 * Returns consistent 400 ApiError on failure.
 *
 * @param {import("zod").ZodTypeAny} schema
 * @returns {import("express").RequestHandler}
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errorDetails = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    const primaryMessage = errorDetails[0]?.message || "Validation failed";
    return next(new ApiError(400, primaryMessage, errorDetails));
  }

  // Assign sanitized and parsed values back to req.body
  req.body = { ...req.body, ...result.data };
  next();
};
