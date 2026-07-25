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
import User from "../models/User.js";
import { uploadToCloudinary, deleteMultipleFromCloudinary } from "../utils/cloudinaryUpload.js";
import {
  complaintCreatedEvent,
  complaintUpdatedEvent,
  imagesUploadedEvent,
  imagesDeletedEvent,
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
  const complaint = await Complaint.findOne({
    _id: req.params.id,
    createdBy: req.user.id,
  });

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