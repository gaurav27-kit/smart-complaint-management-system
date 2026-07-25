/**
 * @file notificationController.js
 * @description HTTP controllers for notification management endpoints.
 *
 * Responsibilities:
 * - Expose notification history to users and admins
 * - Allow admins to manually retry failed notifications
 * - Allow admins to manually trigger scheduled reports
 * - Provide stats for dashboard widgets
 *
 * What this controller does NOT do:
 * - Send emails directly (that's NotificationService's job)
 * - Business logic beyond request/response handling
 */

import Notification from "../models/Notification.js";
import { notificationService } from "../notifications/services/NotificationService.js";
import { runDailySummaryJob, runWeeklyAnalyticsJob } from "../notifications/jobs/ScheduledJob.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import logger from "../utils/logger.js";

// ─── User endpoints ───────────────────────────────────────────────────────────

/**
 * @desc    Get notification history for the authenticated user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50); // Cap at 50
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find({ recipient: req.user.id })
      .select("-body") // Exclude rendered HTML from list responses — too large
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ recipient: req.user.id }),
  ]);

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    notifications,
  });
});

// ─── Admin endpoints ──────────────────────────────────────────────────────────

/**
 * @desc    Get all notifications with filtering (admin)
 * @route   GET /api/notifications/admin
 * @access  Private/Admin
 */
export const getAllNotifications = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .select("-body")
      .populate("recipient", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Notification.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    notifications,
  });
});

/**
 * @desc    Get notification statistics (admin dashboard widget)
 * @route   GET /api/notifications/stats
 * @access  Private/Admin
 */
export const getNotificationStats = asyncHandler(async (req, res) => {
  const [total, sent, failed, pending, retried] = await Promise.all([
    Notification.countDocuments(),
    Notification.countDocuments({ status: "sent" }),
    Notification.countDocuments({ status: "failed" }),
    Notification.countDocuments({ status: "pending" }),
    Notification.countDocuments({ status: "retried" }),
  ]);

  const deliveryRate = total > 0
    ? (((sent + retried) / total) * 100).toFixed(2)
    : "0.00";

  res.status(200).json({
    success: true,
    stats: {
      total,
      sent,
      failed,
      pending,
      retried,
      deliveryRate: `${deliveryRate}%`,
    },
  });
});

/**
 * @desc    Manually retry a failed notification
 * @route   POST /api/notifications/retry/:id
 * @access  Private/Admin
 */
export const retryNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id).populate(
    "recipient",
    "email fullName",
  );

  if (!notification) {
    throw ApiError.notFound("Notification not found");
  }

  if (notification.status !== "failed") {
    throw ApiError.badRequest(
      `Cannot retry a notification with status '${notification.status}'. Only 'failed' notifications can be retried.`,
    );
  }

  // Re-use the stored rendered HTML — no need to re-render
  const recipientEmail =
    notification.metadata?.recipientEmail || notification.recipient?.email;

  if (!recipientEmail) {
    throw ApiError.badRequest(
      "Cannot retry: recipient email is not available",
    );
  }

  try {
    const { emailService } = await import("../notifications/services/EmailService.js");
    const result = await emailService.send({
      to: recipientEmail,
      subject: notification.subject,
      html: notification.body,
    });

    await Notification.findByIdAndUpdate(notification._id, {
      status: "retried",
      sentAt: new Date(),
      retryCount: notification.retryCount + 1,
      providerMessageId: result.messageId,
      lastError: null,
    });

    logger.info({
      message: "Manual notification retry succeeded",
      notificationId: notification._id,
      adminId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Notification resent successfully",
    });
  } catch (error) {
    await Notification.findByIdAndUpdate(notification._id, {
      retryCount: notification.retryCount + 1,
      lastError: error.message,
    });

    throw ApiError.internal(`Retry failed: ${error.message}`);
  }
});

/**
 * @desc    Delete a notification record
 * @route   DELETE /api/notifications/:id
 * @access  Private/Admin
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);

  if (!notification) {
    throw ApiError.notFound("Notification not found");
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted",
  });
});

/**
 * @desc    Manually trigger daily summary report
 * @route   POST /api/admin/notifications/send-daily-summary
 * @access  Private/Admin
 */
export const triggerDailySummary = asyncHandler(async (req, res) => {
  // Run the job asynchronously — don't block the HTTP response
  runDailySummaryJob().catch((err) =>
    logger.error({ message: "Manual daily summary trigger failed", error: err.message }),
  );

  res.status(202).json({
    success: true,
    message: "Daily summary dispatch initiated. Emails will be sent shortly.",
  });
});

/**
 * @desc    Manually trigger weekly analytics report
 * @route   POST /api/admin/notifications/send-weekly-analytics
 * @access  Private/Admin
 */
export const triggerWeeklyAnalytics = asyncHandler(async (req, res) => {
  runWeeklyAnalyticsJob().catch((err) =>
    logger.error({ message: "Manual weekly analytics trigger failed", error: err.message }),
  );

  res.status(202).json({
    success: true,
    message: "Weekly analytics dispatch initiated. Emails will be sent shortly.",
  });
});
