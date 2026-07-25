/**
 * @file departmentController.js
 * @description CRUD controller for managing departments in the SCMS system.
 *
 * Responsibilities:
 * - Create, read, update, and delete departments
 * - Validate duplicate department name and code before create/update operations
 * - Normalize department name (trim) and code (trim & uppercase)
 * - Provide proper logging for auditing mutations
 */

import Department from "../models/Department.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import logger from "../utils/logger.js";

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE DEPARTMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Create a new department
 * @route   POST /api/departments
 * @access  Private/Admin
 */
export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, head, email, phone, isActive } = req.body;

  if (!name || !code) {
    throw ApiError.badRequest("Department name and code are required");
  }

  // Normalize inputs
  const normalizedName = name.trim();
  const normalizedCode = code.trim().toUpperCase();

  // Validate duplicate name
  const existingName = await Department.findOne({ name: normalizedName });
  if (existingName) {
    throw ApiError.conflict("Department with this name already exists");
  }

  // Validate duplicate code
  const existingCode = await Department.findOne({ code: normalizedCode });
  if (existingCode) {
    throw ApiError.conflict("Department with this code already exists");
  }

  const department = await Department.create({
    name: normalizedName,
    code: normalizedCode,
    description: description ? description.trim() : "",
    head: head ? head.trim() : "",
    email: email ? email.trim().toLowerCase() : undefined,
    phone: phone ? phone.trim() : undefined,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    createdBy: req.user?.id,
  });

  logger.info({
    message: "Department created successfully",
    departmentId: department._id,
    code: department.code,
    createdBy: req.user?.id,
  });

  res.status(201).json({
    success: true,
    message: "Department created successfully",
    department,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET ALL DEPARTMENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get all departments with optional search, filter, and pagination
 * @route   GET /api/departments
 * @access  Private
 */
export const getAllDepartments = asyncHandler(async (req, res) => {
  const { search, isActive, page = 1, limit = 10 } = req.query;

  const filter = {};

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  if (search) {
    const searchRegex = new RegExp(search.trim(), "i");
    filter.$or = [
      { name: searchRegex },
      { code: searchRegex },
      { head: searchRegex },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [departments, total] = await Promise.all([
    Department.find(filter)
      .populate("createdBy", "fullName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Department.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: departments.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    departments,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET DEPARTMENT BY ID
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get a single department by ID
 * @route   GET /api/departments/:id
 * @access  Private
 */
export const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await Department.findById(id).populate(
    "createdBy",
    "fullName email role"
  );

  if (!department) {
    throw ApiError.notFound("Department not found");
  }

  res.status(200).json({
    success: true,
    department,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE DEPARTMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Update an existing department
 * @route   PUT /api/departments/:id
 * @access  Private/Admin
 */
export const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, description, head, email, phone, isActive } = req.body;

  const department = await Department.findById(id);

  if (!department) {
    throw ApiError.notFound("Department not found");
  }

  // Validate and update name if provided
  if (name !== undefined) {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw ApiError.badRequest("Department name cannot be empty");
    }

    const existingName = await Department.findOne({
      name: normalizedName,
      _id: { $ne: id },
    });
    if (existingName) {
      throw ApiError.conflict("Department with this name already exists");
    }

    department.name = normalizedName;
  }

  // Validate and update code if provided
  if (code !== undefined) {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      throw ApiError.badRequest("Department code cannot be empty");
    }

    const existingCode = await Department.findOne({
      code: normalizedCode,
      _id: { $ne: id },
    });
    if (existingCode) {
      throw ApiError.conflict("Department with this code already exists");
    }

    department.code = normalizedCode;
  }

  if (description !== undefined) department.description = description.trim();
  if (head !== undefined) department.head = head.trim();
  if (email !== undefined) department.email = email ? email.trim().toLowerCase() : undefined;
  if (phone !== undefined) department.phone = phone ? phone.trim() : undefined;
  if (isActive !== undefined) department.isActive = Boolean(isActive);

  await department.save();

  logger.info({
    message: "Department updated successfully",
    departmentId: department._id,
    code: department.code,
    updatedBy: req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: "Department updated successfully",
    department,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE DEPARTMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Permanently delete a department
 * @route   DELETE /api/departments/:id
 * @access  Private/Admin
 */
export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await Department.findById(id);

  if (!department) {
    throw ApiError.notFound("Department not found");
  }

  await department.deleteOne();

  logger.info({
    message: "Department deleted successfully",
    departmentId: id,
    deletedBy: req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: "Department deleted successfully",
  });
});
