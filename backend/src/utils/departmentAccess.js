/**
 * @file departmentAccess.js
 * @description Shared utility for Department Member authorization.
 *
 * Provides a single canonical source of truth for department-based access
 * filtering. Previously, getMemberAccessFilter() was duplicated across
 * memberController.js and complaintController.js with slightly divergent
 * implementations. This utility consolidates them.
 *
 * Design decisions:
 * - isActive check is lenient (undefined || true) to handle legacy records
 *   gracefully, consistent with the original memberController.js behavior.
 * - Complaint.exists() is used for 403 vs 404 disambiguation: it is faster
 *   and lower-memory than findById().select("_id"), and clearly expresses intent.
 * - This file has no side-effects and is importable by any controller.
 */

import mongoose from "mongoose";
import DepartmentMember from "../models/DepartmentMember.js";
import Complaint from "../models/Complaint.js";
import { ApiError } from "./apiError.js";

/**
 * Build a MongoDB match query scoped to the authenticated Department Member.
 *
 * - HEAD          → { department: <ObjectId> }  (all complaints in their department)
 * - FIELD_OFFICER → { assignedMember: <ObjectId> }  (only their assigned complaints)
 * - No active record found → { _id: null }  (matches nothing)
 *
 * The isActive check is intentionally lenient (undefined OR true) to support
 * legacy records that may not have the field set.
 *
 * @param {string} userId - The authenticated user's _id (from req.user.id)
 * @returns {Promise<Object>} MongoDB query filter object
 */
export const getMemberAccessFilter = async (userId) => {
  if (!userId) {
    return { _id: null };
  }

  const memberRecord = await DepartmentMember.findOne({ user: userId })
    .select("_id department deptRole isActive")
    .lean();

  if (memberRecord && (memberRecord.isActive === undefined || memberRecord.isActive === true)) {
    if (memberRecord.deptRole === "HEAD") {
      const rawDept = memberRecord.department?._id || memberRecord.department;
      if (!rawDept) {
        return { _id: null };
      }
      const deptId = typeof rawDept === "string" ? new mongoose.Types.ObjectId(rawDept) : rawDept;
      return { department: deptId };
    } else {
      const rawMember = memberRecord._id;
      const memberId = typeof rawMember === "string" ? new mongoose.Types.ObjectId(rawMember) : rawMember;
      return { assignedMember: memberId };
    }
  }

  return { _id: null };
};

/**
 * Fetch a single complaint that the authenticated Department Member is authorized to access.
 *
 * Distinguishes between:
 * - Complaint does not exist          → throws 404 Not Found
 * - Complaint exists, no access       → throws 403 Forbidden
 * - Complaint exists, access granted  → returns the Mongoose document
 *
 * Uses Complaint.exists() for the authorization check because it is faster
 * and lower-memory than findById().select("_id"), and clearly expresses intent.
 *
 * @param {string} complaintId - The complaint _id from route params
 * @param {string} userId - The authenticated user's _id (from req.user.id)
 * @returns {Promise<import("mongoose").Document>} The authorized Complaint document
 * @throws {ApiError} 403 if complaint belongs to another department/officer
 * @throws {ApiError} 404 if complaint does not exist
 */
export const getAuthorizedComplaint = async (complaintId, userId) => {
  const accessFilter = await getMemberAccessFilter(userId);

  const complaint = await Complaint.findOne({
    _id: complaintId,
    ...accessFilter,
  });

  if (!complaint) {
    const exists = await Complaint.exists({ _id: complaintId });
    if (exists) {
      throw ApiError.forbidden("Access denied: You are not authorized to view or update this complaint");
    }
    throw ApiError.notFound("Complaint not found");
  }

  return complaint;
};
