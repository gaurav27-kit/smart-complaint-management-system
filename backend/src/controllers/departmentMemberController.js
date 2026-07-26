/**
 * @file departmentMemberController.js
 * @description Controller for managing Department Membership allocations in SCMS.
 *
 * Responsibilities:
 * - Assign users/admins to departments with specific roles
 * - Retrieve department members populated with user info
 * - Remove members from departments
 */

import DepartmentMember from "../models/DepartmentMember.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import logger from "../utils/logger.js";

// ═══════════════════════════════════════════════════════════════════════════════
// ADD DEPARTMENT MEMBER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Add a user/admin to a department
 * @route   POST /api/departments/:departmentId/members or POST /api/department-members
 * @access  Private/Admin
 */
export const addDepartmentMember = asyncHandler(async (req, res) => {
  const departmentId = req.params.departmentId || req.body.departmentId;
  const userId = req.body.userId || req.body.user;
  const { deptRole, isPrimary } = req.body;

  if (!departmentId || !userId) {
    throw ApiError.badRequest("Department ID and User ID are required");
  }

  // 1. Validate department existence
  const department = await Department.findById(departmentId);
  if (!department) {
    throw ApiError.notFound("Department not found");
  }

  // 2. Validate user existence
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  // 3. Prevent duplicate membership
  const existingMember = await DepartmentMember.findOne({
    department: departmentId,
    user: userId,
  });

  if (existingMember) {
    throw ApiError.conflict("User is already a member of this department");
  }

  // 4. Create membership record
  const member = await DepartmentMember.create({
    department: departmentId,
    user: userId,
    deptRole: deptRole || "ADMIN",
    isPrimary: isPrimary !== undefined ? Boolean(isPrimary) : true,
    assignedBy: req.user?.id,
  });

  // Populate user information for client response
  await member.populate("user", "fullName email role");
  await member.populate("department", "name code");

  logger.info({
    message: "Department member added successfully",
    membershipId: member._id,
    departmentId,
    userId,
    deptRole: member.deptRole,
    assignedBy: req.user?.id,
  });

  res.status(201).json({
    success: true,
    message: "Department member added successfully",
    member,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET DEPARTMENT MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get all active members of a department
 * @route   GET /api/departments/:departmentId/members
 * @access  Private/Admin
 */
export const getDepartmentMembers = asyncHandler(async (req, res) => {
  const departmentId = req.params.departmentId || req.query.departmentId;

  if (!departmentId) {
    throw ApiError.badRequest("Department ID is required");
  }

  // Validate department existence
  const department = await Department.findById(departmentId);
  if (!department) {
    throw ApiError.notFound("Department not found");
  }

  const members = await DepartmentMember.find({
    department: departmentId,
    isActive: true,
  })
    .populate("user", "fullName email role")
    .populate("assignedBy", "fullName email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: members.length,
    department: {
      _id: department._id,
      name: department.name,
      code: department.code,
    },
    members,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// REMOVE DEPARTMENT MEMBER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Remove a user from a department
 * @route   DELETE /api/departments/:departmentId/members/:userId or DELETE /api/department-members/:id
 * @access  Private/Admin
 */
export const removeDepartmentMember = asyncHandler(async (req, res) => {
  const { departmentId, userId, id } = req.params;

  let member;

  if (id) {
    member = await DepartmentMember.findById(id);
  } else if (departmentId && userId) {
    member = await DepartmentMember.findOne({
      department: departmentId,
      user: userId,
    });
  } else {
    throw ApiError.badRequest("Membership ID or both Department ID and User ID are required");
  }

  if (!member) {
    throw ApiError.notFound("Department membership record not found");
  }

  await member.deleteOne();

  logger.info({
    message: "Department member removed successfully",
    membershipId: member._id,
    departmentId: member.department,
    userId: member.user,
    removedBy: req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: "Department member removed successfully",
  });
});
