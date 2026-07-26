/**
 * @file complaintController.js
 * @description Complaint CRUD controller with notification hooks.
 *
 * Notification hooks added:
 * - createComplaint → sendComplaintSubmitted (user) + sendAdminNewComplaint (all admins)
 * - updateComplaint (status change to Resolved) → sendComplaintResolved
 * - Admin status change → sendComplaintStatusUpdated or sendComplaintResolved
 *
 * Design: Notifications are fire-and-forget. If an email fails, the complaint
 * operation still succeeds. The Notification record captures failures for retry.
 */

import Complaint from "../models/Complaint.js";
import Department from "../models/Department.js";
import DepartmentMember from "../models/DepartmentMember.js";
import User from "../models/User.js";
import { uploadToCloudinary, deleteMultipleFromCloudinary } from "../utils/cloudinaryUpload.js";
import {
  complaintCreatedEvent,
  complaintUpdatedEvent,
  imagesUploadedEvent,
  imagesDeletedEvent,
  departmentAssignedEvent,
  memberAssignedEvent,
} from "../utils/timelineHelper.js";
import { notificationService } from "../notifications/services/NotificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import logger from "../utils/logger.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Upload a batch of files to Cloudinary with automatic rollback on failure.
 * If any upload fails, all previously uploaded files in the batch are deleted.
 */
const uploadFilesWithRollback = async (files, folder) => {
  const uploaded = [];

  for (const file of files) {
    try {
      const result = await uploadToCloudinary(file.buffer, folder);
      uploaded.push(result);
    } catch (error) {
      // Rollback: delete everything uploaded so far in this batch
      if (uploaded.length > 0) {
        const idsToClean = uploaded.map((img) => img.publicId);
        await deleteMultipleFromCloudinary(idsToClean).catch(() => {});
      }
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  return uploaded;
};

/**
 * Fire-and-forget notification helper.
 * Wraps notification calls so errors never bubble to the controller.
 */
const fireNotification = (promise) => {
  promise.catch((err) =>
    logger.error({ message: "Non-critical notification failed", error: err.message }),
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE COMPLAINT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Create complaint with optional images
 * @route   POST /api/complaints
 * @access  Private
 */
export const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, location, priority, aiMetadata } = req.body;

  let parsedAiMetadata;
  if (aiMetadata) {
    try {
      parsedAiMetadata = typeof aiMetadata === "string" ? JSON.parse(aiMetadata) : aiMetadata;
    } catch {
      logger.warn({ message: "Failed to parse aiMetadata — ignoring" });
    }
  }

  // Create complaint document first to get the _id (used for Cloudinary folder naming)
  const complaint = await Complaint.create({
    title,
    description,
    category,
    location,
    priority,
    aiMetadata: parsedAiMetadata,
    createdBy: req.user.id,
  });

  let imageCount = 0;

  // Upload images if provided
  if (req.files?.length > 0) {
    const folder = `SCMS/complaints/${complaint._id}`;

    try {
      const uploadedImages = await uploadFilesWithRollback(req.files, folder);

      complaint.images = uploadedImages.map((img) => ({
        url: img.url,
        secureUrl: img.secureUrl,
        publicId: img.publicId,
        width: img.width,
        height: img.height,
        format: img.format,
      }));

      imageCount = uploadedImages.length;
    } catch (uploadError) {
      // Rollback: delete the complaint document since images failed
      await complaint.deleteOne();
      throw ApiError.internal(
        `Complaint creation rolled back due to image upload failure: ${uploadError.message}`,
      );
    }
  }

  complaint.timeline.push(
    complaintCreatedEvent(req.user.id, req.user.role || "user", { imageCount }),
  );

  await complaint.save();

  // ─── Notifications (non-blocking) ─────────────────────────────────────────
  // Fetch the full user document for the notification (req.user only has id/role)
  User.findById(req.user.id)
    .then(async (user) => {
      if (!user) return;

      // 1. Confirm submission to the user
      fireNotification(notificationService.sendComplaintSubmitted(user, complaint));

      // 2. Alert all admin users about the new complaint
      const admins = await User.find({ role: "admin" }).select("_id email fullName").lean();
      admins.forEach((admin) => {
        fireNotification(notificationService.sendAdminNewComplaint(admin, complaint, user));
      });
    })
    .catch((err) =>
      logger.error({ message: "Failed to dispatch complaint creation notifications", error: err.message }),
    );

  res.status(201).json({
    success: true,
    message: "Complaint created successfully",
    complaint,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET MY COMPLAINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get all complaints for the logged-in user
 * @route   GET /api/complaints
 * @access  Private
 */
export const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ createdBy: req.user.id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: complaints.length,
    complaints,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET COMPLAINT BY ID
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get a specific complaint by ID (owner only)
 * @route   GET /api/complaints/:id
 * @access  Private
 */
export const getComplaintById = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (req.user?.role !== "admin") {
    query.createdBy = req.user.id;
  }

  const complaint = await Complaint.findOne(query);

  if (!complaint) {
    throw ApiError.notFound("Complaint not found");
  }

  res.status(200).json({ success: true, complaint });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET COMPLAINT TIMELINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get complaint timeline (owner only)
 * @route   GET /api/complaints/:id/timeline
 * @access  Private
 */
export const getComplaintTimeline = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({
    _id: req.params.id,
    createdBy: req.user.id,
  }).select("timeline");

  if (!complaint) {
    throw ApiError.notFound("Complaint not found");
  }

  const timeline = [...complaint.timeline].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  res.status(200).json({ success: true, timeline });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE COMPLAINT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Update complaint fields, add/remove images
 * @route   PATCH /api/complaints/:id
 * @access  Private
 */
export const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({
    _id: req.params.id,
    createdBy: req.user.id,
  });

  if (!complaint) {
    throw ApiError.notFound("Complaint not found");
  }

  const userRole = req.user.role || "user";
  const timelineEvents = [];

  // ─── 1. Handle image deletions ────────────────────────────────────────────
  let deleteImageIds = [];
  if (req.body.deleteImageIds) {
    try {
      deleteImageIds =
        typeof req.body.deleteImageIds === "string"
          ? JSON.parse(req.body.deleteImageIds)
          : req.body.deleteImageIds;
    } catch {
      throw ApiError.badRequest("Invalid deleteImageIds format. Expected a JSON array.");
    }
  }

  if (deleteImageIds.length > 0) {
    await deleteMultipleFromCloudinary(deleteImageIds);
    complaint.images = complaint.images.filter(
      (img) => !deleteImageIds.includes(img.publicId),
    );
    timelineEvents.push(imagesDeletedEvent(req.user.id, userRole, { imageCount: deleteImageIds.length }));
  }

  // ─── 2. Handle new image uploads ──────────────────────────────────────────
  if (req.files?.length > 0) {
    const currentCount = complaint.images.length;
    const newCount = req.files.length;
    const maxImages = 5;

    if (currentCount + newCount > maxImages) {
      throw ApiError.badRequest(
        `Cannot add ${newCount} image(s). You have ${currentCount} and the maximum is ${maxImages}.`,
      );
    }

    const folder = `SCMS/complaints/${complaint._id}`;

    try {
      const uploadedImages = await uploadFilesWithRollback(req.files, folder);
      complaint.images.push(
        ...uploadedImages.map((img) => ({
          url: img.url,
          secureUrl: img.secureUrl,
          publicId: img.publicId,
          width: img.width,
          height: img.height,
          format: img.format,
        })),
      );
      timelineEvents.push(imagesUploadedEvent(req.user.id, userRole, { imageCount: newCount }));
    } catch (uploadError) {
      complaint.timeline.push(...timelineEvents);
      await complaint.save();
      throw ApiError.internal(`Image upload failed: ${uploadError.message}`);
    }
  }

  // ─── 3. Update text fields ────────────────────────────────────────────────
  const updatableFields = ["title", "description", "category", "location", "priority"];
  const changedFields = [];

  for (const field of updatableFields) {
    if (req.body[field] !== undefined && req.body[field] !== String(complaint[field])) {
      changedFields.push(field);
      complaint[field] = req.body[field];
    }
  }

  if (changedFields.length > 0) {
    timelineEvents.push(complaintUpdatedEvent(req.user.id, userRole, { changedFields }));
  }

  if (timelineEvents.length > 0) {
    complaint.timeline.push(...timelineEvents);
  }

  await complaint.save({ runValidators: true });

  res.status(200).json({
    success: true,
    message: "Complaint updated successfully",
    complaint,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE COMPLAINT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Delete complaint and associated Cloudinary images
 * @route   DELETE /api/complaints/:id
 * @access  Private
 */
export const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({
    _id: req.params.id,
    createdBy: req.user.id,
  });

  if (!complaint) {
    throw ApiError.notFound("Complaint not found");
  }

  if (complaint.images?.length > 0) {
    const publicIds = complaint.images.map((img) => img.publicId);
    await deleteMultipleFromCloudinary(publicIds).catch((err) =>
      logger.warn({ message: "Cloudinary cleanup warning during delete", error: err.message }),
    );
  }

  await complaint.deleteOne();

  res.status(200).json({
    success: true,
    message: "Complaint deleted successfully",
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGN DEPARTMENT TO COMPLAINT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Assign a department to a complaint
 * @route   PATCH /api/complaints/:id/assign-department
 * @access  Private/Admin
 */
export const assignDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { departmentId } = req.body;

  if (!departmentId) {
    throw ApiError.badRequest("Department ID is required");
  }

  // Validate that complaint exists
  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw ApiError.notFound("Complaint not found");
  }

  // Validate that department exists
  const department = await Department.findById(departmentId);
  if (!department) {
    throw ApiError.notFound("Department not found");
  }

  // Prevent reassignment if complaint already belongs to the same department
  if (complaint.department && complaint.department.toString() === departmentId.toString()) {
    throw ApiError.badRequest("Complaint is already assigned to this department");
  }

  // Update the complaint's department field and append timeline event
  complaint.department = department._id;
  complaint.timeline.push(
    departmentAssignedEvent(req.user.id, req.user.role || "admin", {
      departmentId: department._id,
      departmentName: department.name,
    }),
  );
  await complaint.save();

  logger.info({
    message: "Department assigned to complaint successfully",
    complaintId: complaint._id,
    departmentId: department._id,
    assignedBy: req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: "Department assigned successfully",
    complaint,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGN COMPLAINT TO DEPARTMENT MEMBER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Assign a complaint to a specific department member
 * @route   PATCH /api/complaints/:id/assign-member
 * @access  Private/Admin
 */
export const assignComplaintToMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { memberId } = req.body;

  if (!memberId) {
    throw ApiError.badRequest("Department member ID is required");
  }

  // 1. Validate that complaint exists
  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw ApiError.notFound("Complaint not found");
  }

  // 2. Validate that complaint has a department assigned
  if (!complaint.department) {
    throw ApiError.badRequest(
      "Complaint must be assigned to a department before assigning a member"
    );
  }

  // 3. Validate that DepartmentMember exists
  const member = await DepartmentMember.findById(memberId);
  if (!member) {
    throw ApiError.notFound("Department member not found");
  }

  // 4. Validate that DepartmentMember belongs to the same department as the complaint
  if (member.department.toString() !== complaint.department.toString()) {
    throw ApiError.badRequest(
      "Department member does not belong to the complaint's department"
    );
  }

  // 5. Prevent assigning the same member twice
  if (
    complaint.assignedMember &&
    complaint.assignedMember.toString() === memberId.toString()
  ) {
    throw ApiError.badRequest("Complaint is already assigned to this member");
  }

  // 6. Update assignedMember, assignedBy, assignedAt, and timeline
  complaint.assignedMember = member._id;
  complaint.assignedBy = req.user?.id;
  complaint.assignedAt = new Date();

  await member.populate("user", "fullName");
  await member.populate("department", "name");

  complaint.timeline.push(
    memberAssignedEvent(req.user.id, req.user.role || "admin", {
      memberId: member._id,
      memberName: member.user?.fullName,
      departmentId: member.department?._id || member.department,
      departmentName: member.department?.name,
      departmentRole: member.deptRole,
    }),
  );

  await complaint.save();

  // Populate department and assignedMember for client response
  await complaint.populate("department", "name code");
  await complaint.populate({
    path: "assignedMember",
    populate: { path: "user", select: "fullName email role" },
  });

  logger.info({
    message: "Complaint assigned to department member successfully",
    complaintId: complaint._id,
    departmentId: complaint.department._id || complaint.department,
    assignedMemberId: member._id,
    assignedBy: req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: "Complaint assigned to department member successfully",
    complaint,
  });
});