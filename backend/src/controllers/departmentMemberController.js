/**
 * @file departmentMemberController.js
 * @description Controller for managing Department Membership allocations in SCMS.
 *
 * Responsibilities:
 * - Create new department_member users with auto-generated unique Employee IDs (EMP0001...)
 * - Enforce One HEAD Validation per department (409 Conflict if duplicate HEAD)
 * - Soft Delete (set isActive = false) for members & users to preserve full historical audit trail
 * - Reactivation support for previously deactivated members
 * - Retrieve active/all department members with populate and lean performance optimization
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import DepartmentMember from "../models/DepartmentMember.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { notificationService } from "../notifications/services/NotificationService.js";
import logger from "../utils/logger.js";

/**
 * Helper: Generate unique Employee ID (e.g. EMP0001) or validate provided ID
 */
const generateEmployeeId = async (providedId) => {
  if (providedId && String(providedId).trim()) {
    const trimmed = String(providedId).trim();
    const existing = await User.findOne({ employeeId: trimmed });
    if (existing) {
      throw ApiError.conflict(`Employee ID "${trimmed}" is already assigned to another user.`);
    }
    return trimmed;
  }

  // Auto-generate: EMP0001, EMP0002...
  const count = await User.countDocuments({ employeeId: { $exists: true } });
  let nextSeq = count + 1;
  let candidate = `EMP${String(nextSeq).padStart(4, "0")}`;

  while (await User.findOne({ employeeId: candidate })) {
    nextSeq += 1;
    candidate = `EMP${String(nextSeq).padStart(4, "0")}`;
  }

  return candidate;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADD / CREATE DEPARTMENT MEMBER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Create a new department_member account and assign to a department
 * @route   POST /api/departments/members or POST /api/departments/:departmentId/members
 * @access  Private/Admin
 */
export const addDepartmentMember = asyncHandler(async (req, res) => {
  const departmentId =
    req.params.departmentId || req.body.departmentId || req.body.department;
  let userId = req.body.userId || req.body.user;
  const {
    fullName,
    email,
    password,
    phoneNumber,
    phone,
    employeeId: providedEmployeeId,
    deptRole,
    isPrimary,
  } = req.body;

  const selectedRole = deptRole ? deptRole.toUpperCase() : "FIELD_OFFICER";
  if (!["HEAD", "FIELD_OFFICER"].includes(selectedRole)) {
    throw ApiError.badRequest(
      "Department role must be either HEAD or FIELD_OFFICER"
    );
  }

  if (!departmentId) {
    throw ApiError.badRequest("Department is required");
  }

  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw ApiError.badRequest("Invalid Department ID format");
  }

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    throw ApiError.badRequest("Invalid User ID format");
  }

  // 1. Validate department existence
  const department = await Department.findById(departmentId);
  if (!department) {
    throw ApiError.notFound("Department not found");
  }

  // Security Authorization: Admin can add any role to any department.
  // Department HEAD can only add FIELD_OFFICER to their own department.
  if (req.user?.role !== "admin") {
    const callerRecord = await DepartmentMember.findOne({ user: req.user.id })
      .select("department deptRole isActive")
      .lean();

    const isCallerActiveHead =
      callerRecord &&
      (callerRecord.isActive === undefined || callerRecord.isActive === true) &&
      callerRecord.deptRole === "HEAD";

    if (
      !isCallerActiveHead ||
      callerRecord.department.toString() !== departmentId.toString() ||
      selectedRole !== "FIELD_OFFICER"
    ) {
      throw ApiError.forbidden("Access denied: Department Heads can only add Field Officers to their department.");
    }
  }

  // 2. ONE HEAD Validation: Allow only ONE active HEAD per department
  if (selectedRole === "HEAD") {
    const existingHead = await DepartmentMember.findOne({
      department: departmentId,
      deptRole: "HEAD",
      isActive: true,
    });

    if (existingHead) {
      throw ApiError.conflict(
        "Department already has an active HEAD member. Please reassign or deactivate the current HEAD before assigning a new one."
      );
    }
  }

  // 3. If no userId provided, create new User record with employeeId
  if (!userId) {
    if (!fullName?.trim() || !email?.trim() || !password) {
      throw ApiError.badRequest(
        "Full Name, Email, and Temporary Password are required to create a new member"
      );
    }

    if (password.length < 6) {
      throw ApiError.badRequest("Password must be at least 6 characters");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email uniqueness
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const employeeId = await generateEmployeeId(providedEmployeeId);

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "department_member",
      emailVerified: true,
      phoneNumber: phoneNumber || phone || "",
      employeeId,
      isActive: true,
    });

    userId = newUser._id;

    // Send welcome notification asynchronously
    notificationService.sendWelcomeEmail(newUser).catch((err) =>
      logger.error({
        message: "[Member] Failed to send welcome email",
        error: err.message,
      })
    );
  } else {
    // Validate existing user existence
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      throw ApiError.notFound("User not found");
    }
  }

  // 4. Duplicate/Reactivation check
  const existingMember = await DepartmentMember.findOne({
    department: departmentId,
    user: userId,
  });

  if (existingMember) {
    if (existingMember.isActive) {
      throw ApiError.conflict("User is already an active member of this department");
    }

    // Reactivate soft-deleted membership
    existingMember.isActive = true;
    existingMember.deptRole = selectedRole;
    await existingMember.save();

    await User.findByIdAndUpdate(userId, { isActive: true });

    await existingMember.populate("user", "fullName email role phoneNumber employeeId isActive");
    await existingMember.populate("department", "name code");

    return res.status(200).json({
      success: true,
      message: "Department member reactivated successfully",
      member: existingMember,
    });
  }

  // 5. Create membership record
  const member = await DepartmentMember.create({
    department: departmentId,
    user: userId,
    deptRole: selectedRole,
    isPrimary: isPrimary !== undefined ? Boolean(isPrimary) : true,
    isActive: true,
    assignedBy: req.user?.id,
  });

  // Populate user and department information for client response
  await member.populate("user", "fullName email role phoneNumber employeeId isActive");
  await member.populate("department", "name code");

  logger.info({
    message: "Department member created successfully",
    membershipId: member._id,
    departmentId,
    userId,
    deptRole: member.deptRole,
    assignedBy: req.user?.id,
  });

  res.status(201).json({
    success: true,
    message: "Department member created successfully",
    member,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET DEPARTMENT MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get all department members (active by default, or all with includeInactive=true)
 * @route   GET /api/departments/members or GET /api/departments/:departmentId/members
 * @access  Private/Admin
 */
export const getDepartmentMembers = asyncHandler(async (req, res) => {
  const departmentId = req.params.departmentId || req.query.departmentId;
  const includeInactive =
    req.query.includeInactive === "true" || req.query.all === "true";

  let query = {};
  if (!includeInactive) {
    query.isActive = true;
  }

  if (departmentId) {
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      throw ApiError.badRequest("Invalid Department ID format");
    }
    const department = await Department.findById(departmentId);
    if (!department) {
      throw ApiError.notFound("Department not found");
    }
    query.department = departmentId;
  }

  const members = await DepartmentMember.find(query)
    .populate("user", "fullName email role phoneNumber employeeId isActive")
    .populate("department", "name code")
    .populate("assignedBy", "fullName email")
    .lean()
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: members.length,
    members,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// REMOVE / SOFT DELETE DEPARTMENT MEMBER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Soft delete a user from a department (set isActive = false)
 * @route   DELETE /api/departments/members/:memberId or DELETE /api/departments/:departmentId/members/:userId
 * @access  Private/Admin
 */
export const removeDepartmentMember = asyncHandler(async (req, res) => {
  const { departmentId, userId, id, memberId } = req.params;

  const targetId = memberId || id;
  let member;

  if (targetId) {
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      throw ApiError.badRequest("Invalid Member ID format");
    }
    member = await DepartmentMember.findById(targetId);
  } else if (departmentId && userId) {
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      throw ApiError.badRequest("Invalid Department ID format");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.badRequest("Invalid User ID format");
    }
    member = await DepartmentMember.findOne({
      department: departmentId,
      user: userId,
    });
  } else {
    throw ApiError.badRequest(
      "Membership ID or both Department ID and User ID are required"
    );
  }

  if (!member) {
    throw ApiError.notFound("Department membership record not found");
  }

  // Security Authorization: Admin can deactivate anyone.
  // Department HEAD can only deactivate FIELD_OFFICER in their own department.
  if (req.user?.role !== "admin") {
    const callerRecord = await DepartmentMember.findOne({ user: req.user.id })
      .select("department deptRole isActive")
      .lean();

    const isCallerActiveHead =
      callerRecord &&
      (callerRecord.isActive === undefined || callerRecord.isActive === true) &&
      callerRecord.deptRole === "HEAD";

    if (
      !isCallerActiveHead ||
      callerRecord.department.toString() !== member.department.toString() ||
      member.deptRole !== "FIELD_OFFICER"
    ) {
      throw ApiError.forbidden("Access denied: You can only manage Field Officers in your department.");
    }
  }

  // Soft Delete: Set isActive = false to preserve historical complaints & audit trail
  member.isActive = false;
  await member.save();

  if (member.user) {
    await User.findByIdAndUpdate(member.user, { isActive: false });
  }

  logger.info({
    message: "Department member deactivated (soft deleted) successfully",
    membershipId: member._id,
    departmentId: member.department,
    userId: member.user,
    deactivatedBy: req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: "Department member deactivated successfully",
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// REACTIVATE DEPARTMENT MEMBER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Reactivate a soft-deleted department member
 * @route   PATCH /api/departments/members/:memberId/reactivate
 * @access  Private/Admin
 */
export const reactivateDepartmentMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    throw ApiError.badRequest("Invalid Member ID format");
  }

  const member = await DepartmentMember.findById(memberId);
  if (!member) {
    throw ApiError.notFound("Department member record not found");
  }

  // Security Authorization: Admin can reactivate anyone.
  // Department HEAD can only reactivate FIELD_OFFICER in their own department.
  if (req.user?.role !== "admin") {
    const callerRecord = await DepartmentMember.findOne({ user: req.user.id })
      .select("department deptRole isActive")
      .lean();

    const isCallerActiveHead =
      callerRecord &&
      (callerRecord.isActive === undefined || callerRecord.isActive === true) &&
      callerRecord.deptRole === "HEAD";

    if (
      !isCallerActiveHead ||
      callerRecord.department.toString() !== member.department.toString() ||
      member.deptRole !== "FIELD_OFFICER"
    ) {
      throw ApiError.forbidden("Access denied: You can only reactivate Field Officers in your department.");
    }
  }

  // One HEAD Validation on Reactivation
  if (member.deptRole === "HEAD") {
    const existingHead = await DepartmentMember.findOne({
      department: member.department,
      deptRole: "HEAD",
      isActive: true,
      _id: { $ne: member._id },
    });

    if (existingHead) {
      throw ApiError.conflict(
        "Department already has an active HEAD member. Please reassign or deactivate the current HEAD before reactivating."
      );
    }
  }

  member.isActive = true;
  await member.save();

  if (member.user) {
    await User.findByIdAndUpdate(member.user, { isActive: true });
  }

  await member.populate("user", "fullName email role phoneNumber employeeId isActive");
  await member.populate("department", "name code");

  logger.info({
    message: "Department member reactivated successfully",
    membershipId: member._id,
    reactivatedBy: req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: "Department member reactivated successfully",
    member,
  });
});


