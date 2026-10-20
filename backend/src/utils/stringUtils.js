/**
 * @file stringUtils.js
 * @description Utility functions for safe string processing and regex sanitization.
 */

/**
 * Escapes characters with special meaning in regular expressions
 * and caps length to protect against Regex Denial of Service (ReDoS) and injection.
 *
 * @param {string} input - User search string
 * @param {number} maxLength - Maximum length to allow (default: 100)
 * @returns {string} Escaped string safe for $regex queries
 */
export const sanitizeSearchRegex = (input, maxLength = 100) => {
  if (typeof input !== "string") return "";
  const trimmed = input.trim().slice(0, maxLength);
  return trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
