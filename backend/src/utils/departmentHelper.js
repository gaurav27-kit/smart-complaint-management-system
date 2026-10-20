/**
 * @file departmentHelper.js
 * @description Helper utility to suggest appropriate Department based on complaint category.
 */

import Department from "../models/Department.js";
import logger from "./logger.js";

/**
 * Single Source of Truth for Category -> Department Code Mapping.
 * Supports stable internal category values, citizen-friendly labels, and legacy strings.
 */
export const CATEGORY_TO_DEPARTMENT = {
  // Stable Internal Values
  ROAD_DAMAGE: "ROAD",
  WATER_LEAKAGE: "WATER",
  GARBAGE_COLLECTION: "GARBAGE",
  STREET_LIGHT: "ELECTRIC",
  DRAINAGE: "ROAD",
  PUBLIC_SAFETY: "SAFETY",
  HEALTH_SANITATION: "HEALTH",
  IT_WEBSITE: "IT",

  // Citizen-Friendly Category Labels
  "ROAD DAMAGE / POTHOLES": "ROAD",
  "WATER SUPPLY / LEAKAGE": "WATER",
  "GARBAGE COLLECTION": "GARBAGE",
  "STREET LIGHT ISSUE": "ELECTRIC",
  "DRAINAGE PROBLEM": "ROAD",
  "PUBLIC SAFETY": "SAFETY",
  "HEALTH & SANITATION": "HEALTH",
  "IT / WEBSITE ISSUE": "IT",

  // Legacy Category Strings for Backward Compatibility
  ROAD: "ROAD",
  "STREET LIGHT": "ELECTRIC",
  WATER: "WATER",
  GARBAGE: "GARBAGE",
  ELECTRICITY: "ELECTRIC",
  ELECTRIC: "ELECTRIC",
  IT: "IT",
  HEALTH: "HEALTH",
  "PUBLIC SAFETY": "SAFETY",
  SAFETY: "SAFETY",
};

/**
 * Look up target Department document in MongoDB by category.
 * Returns Department ObjectId if found, or null if no mapping exists / not found.
 *
 * @param {string} category - Complaint category string
 * @returns {Promise<import("mongoose").Types.ObjectId|null>} Department ObjectId or null
 */
export const suggestDepartmentByCategory = async (category) => {
  if (!category || typeof category !== "string") {
    logger.info({ message: "suggestDepartmentByCategory — invalid or empty category", category });
    return null;
  }

  const rawTrimmed = category.trim();
  const normalizedCategory = rawTrimmed.toUpperCase();

  const targetCode = CATEGORY_TO_DEPARTMENT[normalizedCategory];

  try {
    let department = null;

    if (targetCode) {
      department = await Department.findOne({
        code: targetCode,
        isActive: true,
      }).select("_id name code").lean();
    }

    if (!department) {
      department = await Department.findOne({
        $or: [
          { name: new RegExp(`^${rawTrimmed}$`, "i") },
          { name: new RegExp(rawTrimmed, "i") },
          { code: normalizedCategory },
        ],
        isActive: true,
      }).select("_id name code").lean();
    }

    logger.info({
      message: "suggestDepartmentByCategory debug result",
      selectedCategory: category,
      targetCode,
      suggestedDepartmentDocument: department,
      suggestedDepartmentId: department ? department._id : null,
    });

    return department ? department._id : null;
  } catch (error) {
    logger.warn({
      message: "Error suggesting department by category — returning null",
      category,
      error: error.message,
    });
    return null;
  }
};
