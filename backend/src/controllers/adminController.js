/**
 * @file adminController.js
 * @description Admin-only controllers with notification hooks for status changes.
 *
 * Notification hooks added:
 * - updateComplaintStatus → sendComplaintStatusUpdated or sendComplaintResolved
 *   (automatically fires the correct email based on whether status is "Resolved")
 * - sendComplaintAssigned → when status changes to "In Progress" (implies assignment)
 *
 * Design: All notification calls are fire-and-forget using the `fireNotification` pattern.
 * If email delivery fails, the admin's response is unaffected. The Notification model
 * records failures for the RetryJob to pick up.
 */

import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import { deleteMultipleFromCloudinary } from "../utils/cloudinaryUpload.js";
import { statusChangedEvent } from "../utils/timelineHelper.js";
import { notificationService } from "../notifications/services/NotificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import logger from "../utils/logger.js";

// ─── Helper ───────────────────────────────────────────────────────────────────
const fireNotification = (promise) => {
  promise.catch((err) =>
    logger.error({ message: "Non-critical notification failed", error: err.message }),
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  // Use Promise.all for concurrent queries — 6x faster than sequential
  const [totalUsers, totalComplaints, pending, inProgress, resolved, highPriority, mediumPriority, lowPriority] =
    await Promise.all([
      User.countDocuments(),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: "Pending" }),
      Complaint.countDocuments({ status: "In Progress" }),
      Complaint.countDocuments({ status: "Resolved" }),
      Complaint.countDocuments({ priority: "High" }),
      Complaint.countDocuments({ priority: "Medium" }),
      Complaint.countDocuments({ priority: "Low" }),
    ]);

  res.status(200).json({
    success: true,
    dashboard: {
      totalUsers,
      totalComplaints,
      pending,
      inProgress,
      resolved,
      highPriority,
      mediumPriority,
      lowPriority,
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET ALL COMPLAINTS (with search, filter, sort, pagination)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get all complaints with search, filter, sort & pagination
 * @route   GET /api/admin/complaints
 * @access  Private/Admin
 */
export const getAllComplaints = asyncHandler(async (req, res) => {
  const { search, status, priority, category, sort, page = 1, limit = 10 } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;

  let sortOptions = { createdAt: -1 };
  if (sort === "oldest") sortOptions = { createdAt: 1 };
  else if (sort === "priority") sortOptions = { priority: -1, createdAt: -1 };
  else if (sort === "newest") sortOptions = { createdAt: -1 };

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [totalComplaints, complaints] = await Promise.all([
    Complaint.countDocuments(query),
    Complaint.find(query)
      .populate("createdBy", "fullName email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum),
  ]);

  const totalPages = Math.ceil(totalComplaints / limitNum) || 1;

  res.status(200).json({
    success: true,
    count: complaints.length,
    totalComplaints,
    totalPages,
    currentPage: pageNum,
    complaints,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET COMPLAINT BY ID
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get complaint by ID (admin — no ownership filter)
 * @route   GET /api/admin/complaints/:id
 * @access  Private/Admin
 */
export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate(
    "createdBy",
    "fullName email",
  );

  if (!complaint) {
    throw ApiError.notFound("Complaint not found");
  }

  res.status(200).json({ success: true, complaint });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE COMPLAINT STATUS  (with notification hooks)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Update complaint status
 * @route   PATCH /api/admin/complaints/:id/status
 * @access  Private/Admin
 *
 * Notification hooks:
 * - "Pending" → "In Progress": sends COMPLAINT_ASSIGNED notification
 * - "In Progress" → "Resolved": sends COMPLAINT_RESOLVED notification
 * - Any other transition: sends COMPLAINT_STATUS_UPDATED notification
 */
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const allowedStatus = ["Pending", "In Progress", "Resolved"];

  if (!allowedStatus.includes(status)) {
    throw ApiError.badRequest(
      `Invalid status value. Allowed values: ${allowedStatus.join(", ")}`,
    );
  }

  const complaint = await Complaint.findById(req.params.id).populate(
    "createdBy",
    "_id fullName email",
  );

  if (!complaint) {
    throw ApiError.notFound("Complaint not found");
  }

  const oldStatus = complaint.status;

  // Skip if status hasn't actually changed
  if (oldStatus === status) {
    return res.status(200).json({
      success: true,
      message: "Status is already set to this value",
      complaint,
    });
  }

  complaint.status = status;

  // Timeline event
  complaint.timeline.push(
    statusChangedEvent(req.user.id, "admin", { oldStatus, newStatus: status }),
  );

  await complaint.save();

  // ─── Notifications (non-blocking) ─────────────────────────────────────────
  const complaintOwner = complaint.createdBy;

  if (complaintOwner) {
    if (status === "Resolved") {
      // Special resolved notification — celebratory email
      fireNotification(notificationService.sendComplaintResolved(complaintOwner, complaint));
    } else if (status === "In Progress" && oldStatus === "Pending") {
      // First assignment — sends the "assigned" notification
      fireNotification(notificationService.sendComplaintAssigned(complaintOwner, complaint));
    } else {
      // Generic status update notification
      fireNotification(
        notificationService.sendComplaintStatusUpdated(complaintOwner, complaint, oldStatus),
      );
    }
  }

  res.status(200).json({
    success: true,
    message: "Complaint status updated successfully",
    complaint,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE COMPLAINT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Delete complaint (admin)
 * @route   DELETE /api/admin/complaints/:id
 * @access  Private/Admin
 */
export const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    throw ApiError.notFound("Complaint not found");
  }

  // Cleanup Cloudinary images
  if (complaint.images?.length > 0) {
    const publicIds = complaint.images.map((img) => img.publicId);
    await deleteMultipleFromCloudinary(publicIds).catch((err) =>
      logger.warn({ message: "Cloudinary cleanup warning during admin delete", error: err.message }),
    );
  }

  await complaint.deleteOne();

  res.status(200).json({
    success: true,
    message: "Complaint deleted successfully",
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get analytics data with true date ranges & custom filters
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  const { range = "month", startDate: qStart, endDate: qEnd } = req.query;

  let dateFilter = {};

  if (qStart || qEnd) {
    dateFilter.createdAt = {};
    if (qStart) {
      const start = new Date(qStart);
      start.setHours(0, 0, 0, 0);
      dateFilter.createdAt.$gte = start;
    }
    if (qEnd) {
      const end = new Date(qEnd);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt.$lte = end;
    }
  } else {
    const now = new Date();
    let startDate = new Date();

    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day;
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Default: month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    }

    dateFilter.createdAt = { $gte: startDate };
  }

  // Run all aggregations concurrently
  const [
    totalComplaints,
    pending,
    inProgress,
    resolved,
    highPriority,
    mediumPriority,
    lowPriority,
    categoryWise,
    monthlyTrend,
  ] = await Promise.all([
    Complaint.countDocuments(dateFilter),
    Complaint.countDocuments({ ...dateFilter, status: "Pending" }),
    Complaint.countDocuments({ ...dateFilter, status: "In Progress" }),
    Complaint.countDocuments({ ...dateFilter, status: "Resolved" }),
    Complaint.countDocuments({ ...dateFilter, priority: "High" }),
    Complaint.countDocuments({ ...dateFilter, priority: "Medium" }),
    Complaint.countDocuments({ ...dateFilter, priority: "Low" }),
    Complaint.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Complaint.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  const resolutionRate =
    totalComplaints === 0 ? 0 : ((resolved / totalComplaints) * 100).toFixed(2);

  const nowTemp = new Date();
  const startOfCurrentMonth = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), 1);
  startOfCurrentMonth.setHours(0, 0, 0, 0);
  const thisMonthCount = await Complaint.countDocuments({
    createdAt: { $gte: startOfCurrentMonth },
  });

  res.status(200).json({
    success: true,
    analytics: {
      totalComplaints,
      pending,
      inProgress,
      resolved,
      highPriority,
      mediumPriority,
      lowPriority,
      resolutionRate,
      categoryWise,
      monthlyTrend,
      thisMonthCount,
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @desc    Change admin password
 * @route   PATCH /api/admin/change-password
 * @access  Private/Admin
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw ApiError.badRequest("All fields are required: currentPassword, newPassword, confirmPassword");
  }

  if (newPassword.length < 6) {
    throw ApiError.badRequest("New password must be at least 6 characters long");
  }

  if (newPassword !== confirmPassword) {
    throw ApiError.badRequest("New password and confirm password do not match");
  }

  if (currentPassword === newPassword) {
    throw ApiError.badRequest("New password must be different from current password");
  }

  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw ApiError.badRequest("Incorrect current password");
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  logger.info({ message: "[Admin] Password changed", userId: user._id });

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});
