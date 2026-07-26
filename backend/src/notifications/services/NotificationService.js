/**
 * @file NotificationService.js
 * @description Central orchestrator for all application notifications.
 *
 * Architecture decisions:
 *
 * 1. PERSISTENCE-FIRST: Every notification is saved to MongoDB with `pending` status
 *    BEFORE the email is sent. This guarantees that even if the server crashes
 *    mid-send, the RetryJob can pick it up and retry.
 *
 * 2. FIRE-AND-FORGET: `dispatch()` saves the notification record and returns immediately
 *    without awaiting the actual send. The `_sendAsync()` method handles delivery in the
 *    background. Controllers respond to clients quickly; emails send independently.
 *
 * 3. BULLMQ-READY: Replace `_sendAsync()` with `notificationQueue.add(...)` when adding
 *    Redis. Zero changes to controllers, models, or templates.
 *
 * 4. SINGLE RESPONSIBILITY: NotificationService orchestrates (WHAT, WHEN, WHO).
 *    EmailService handles delivery (HOW). TemplateEngine handles rendering (FORMAT).
 *    Notification model handles persistence (WHERE).
 */

import Notification from "../../models/Notification.js";
import { emailService } from "./EmailService.js";
import { templateEngine } from "../templates/engine.js";
import logger from "../../utils/logger.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:5173/admin";
const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL ||
  process.env.EMAIL_FROM_ADDRESS ||
  "support@scms.com";

/**
 * Format a Date as a human-readable string.
 * @param {Date} [date]
 * @returns {string}
 */
const formatDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata",
  }).format(date);

const currentYear = () => new Date().getFullYear();

class NotificationService {
  /**
   * Core dispatcher — saves notification record and triggers async send.
   *
   * @param {object} options
   * @param {object} options.recipient - User object (must have _id and email)
   * @param {string} options.type - NOTIFICATION_TYPE enum value
   * @param {string} options.subject - Email subject line
   * @param {string} options.templateName - Template filename (no .html extension)
   * @param {object} options.templateVars - Variables to inject into the template
   * @param {object} [options.metadata] - Business context (complaintId, etc.)
   * @returns {Promise<Notification>} The created Notification document
   */
  async dispatch({
    recipient,
    type,
    subject,
    templateName,
    templateVars,
    metadata = {},
  }) {
    logger.info({
      message: "Notification dispatch started",
      type,
      recipientId: recipient?._id,
      recipientEmail: recipient?.email,
      templateName,
    });

    // ─── 1. Render template ───────────────────────────────────────────────
    let renderedHtml;
    try {
      renderedHtml = templateEngine.render(templateName, {
        ...templateVars,
        year: currentYear(),
        supportEmail: SUPPORT_EMAIL,
      });
      logger.debug({
        message: "Template rendered successfully",
        templateName,
      });
    } catch (renderError) {
      logger.error({
        message: "Template render failed — notification aborted",
        templateName,
        type,
        recipientId: recipient?._id,
        error: renderError.message,
      });
      throw renderError;
    }

    // ─── 2. Persist notification record (pending status) ──────────────────
    // Ensures recipientEmail is always saved in metadata for background retry jobs
    const notification = await Notification.create({
      recipient: recipient._id,
      type,
      channel: "email",
      status: "pending",
      subject,
      body: renderedHtml,
      provider: emailService.providerName,
      metadata: {
        ...metadata,
        recipientEmail: recipient.email,
      },
    });

    logger.info({
      message: "Notification record created in MongoDB",
      notificationId: notification._id,
      type,
      recipientEmail: recipient.email,
      subject,
      provider: emailService.providerName,
    });

    // ─── 3. Fire-and-forget async send ────────────────────────────────────
    // We intentionally do NOT await this. The notification status is tracked in DB.
    // When BullMQ is added: replace this line with queue.add('email', payload)
    this._sendAsync(notification, recipient.email, subject, renderedHtml);

    return notification;
  }

  /**
   * Internal async email sender. Updates notification status after delivery attempt.
   * Never throws — errors are logged and persisted to the Notification document.
   *
   * @private
   */
  async _sendAsync(notification, to, subject, html) {
    try {
      const result = await emailService.send({ to, subject, html });

      await Notification.findByIdAndUpdate(notification._id, {
        status: "sent",
        sentAt: new Date(),
        providerMessageId: result.messageId,
      });

      logger.info({
        message: "Notification delivered successfully",
        notificationId: notification._id,
        type: notification.type,
        to,
        messageId: result.messageId,
      });
    } catch (error) {
      await Notification.findByIdAndUpdate(notification._id, {
        status: "failed",
        failedAt: new Date(),
        lastError: error.message.substring(0, 500),
      });

      logger.error({
        message: "Notification delivery failed",
        notificationId: notification._id,
        type: notification.type,
        to,
        error: error.message,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Send email verification link to a new user.
   * @param {object} user - User document
   * @param {string} rawToken - Unencrypted token (sent in URL, never stored)
   */
  async sendEmailVerification(user, rawToken) {
    const verificationUrl = `${BASE_URL}/verify-email/${rawToken}`;

    return this.dispatch({
      recipient: user,
      type: "EMAIL_VERIFICATION",
      subject: "Verify your email address — SCMS",
      templateName: "emailVerification",
      templateVars: {
        userName: user.fullName,
        verificationUrl,
      },
    });
  }

  /**
   * Send welcome email after successful email verification.
   * @param {object} user - User document
   */
  async sendWelcomeEmail(user) {
    return this.dispatch({
      recipient: user,
      type: "WELCOME",
      subject: `Welcome to SCMS, ${user.fullName}! 🎉`,
      templateName: "welcome",
      templateVars: {
        userName: user.fullName,
        dashboardUrl: `${BASE_URL}/dashboard`,
      },
    });
  }

  /**
   * Send password reset link.
   * @param {object} user - User document
   * @param {string} rawToken - Unencrypted reset token
   */
  async sendForgotPassword(user, rawToken) {
    const resetUrl = `${BASE_URL}/reset-password/${rawToken}`;

    return this.dispatch({
      recipient: user,
      type: "FORGOT_PASSWORD",
      subject: "Password reset request — SCMS",
      templateName: "forgotPassword",
      templateVars: {
        userName: user.fullName,
        userEmail: user.email,
        resetUrl,
      },
    });
  }

  /**
   * Confirm successful password reset.
   * @param {object} user - User document
   */
  async sendPasswordResetSuccess(user) {
    return this.dispatch({
      recipient: user,
      type: "PASSWORD_RESET_SUCCESS",
      subject: "Your SCMS password has been reset",
      templateName: "passwordResetSuccess",
      templateVars: {
        userName: user.fullName,
        userEmail: user.email,
        resetTime: formatDate(),
        loginUrl: `${BASE_URL}/login`,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLAINT NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Notify user that their complaint was submitted successfully.
   * @param {object} user - The complaint owner
   * @param {object} complaint - Mongoose complaint document
   */
  async sendComplaintSubmitted(user, complaint) {
    return this.dispatch({
      recipient: user,
      type: "COMPLAINT_SUBMITTED",
      subject: `Complaint received: ${complaint.title} — SCMS`,
      templateName: "complaintSubmitted",
      templateVars: {
        userName: user.fullName,
        complaintId: complaint._id.toString().slice(-8).toUpperCase(),
        complaintTitle: complaint.title,
        complaintCategory: complaint.category,
        complaintLocation: complaint.location,
        complaintPriority: complaint.priority,
        complaintUrl: `${BASE_URL}/complaints/${complaint._id}`,
      },
      metadata: { complaintId: complaint._id },
    });
  }

  /**
   * Notify user that their complaint has been assigned to a team member.
   * @param {object} user - The complaint owner
   * @param {object} complaint - Complaint document
   */
  async sendComplaintAssigned(user, complaint) {
    return this.dispatch({
      recipient: user,
      type: "COMPLAINT_ASSIGNED",
      subject: `Complaint assigned: ${complaint.title} — SCMS`,
      templateName: "complaintAssigned",
      templateVars: {
        userName: user.fullName,
        complaintId: complaint._id.toString().slice(-8).toUpperCase(),
        complaintTitle: complaint.title,
        complaintCategory: complaint.category,
        complaintPriority: complaint.priority,
        assignedAt: formatDate(),
        complaintUrl: `${BASE_URL}/complaints/${complaint._id}`,
      },
      metadata: { complaintId: complaint._id },
    });
  }

  /**
   * Notify assigned department member that a complaint has been assigned to them.
   * @param {object} memberUser - User document of the department member
   * @param {object} complaint - Complaint document
   */
  async sendComplaintAssignedToMember(memberUser, complaint) {
    return this.dispatch({
      recipient: memberUser,
      type: "MEMBER_COMPLAINT_ASSIGNED",
      subject: `New complaint assigned to you: ${complaint.title} — SCMS`,
      templateName: "memberComplaintAssigned",
      templateVars: {
        userName: memberUser.fullName,
        complaintId: complaint._id.toString().slice(-8).toUpperCase(),
        complaintTitle: complaint.title,
        complaintCategory: complaint.category,
        complaintPriority: complaint.priority,
        complaintLocation: complaint.location || "N/A",
        assignedAt: formatDate(),
        complaintUrl: `${BASE_URL}/complaints/${complaint._id}`,
      },
      metadata: { complaintId: complaint._id },
    });
  }

  /**
   * Notify user that their complaint status has changed.
   * @param {object} user - The complaint owner
   * @param {object} complaint - Complaint document (post-update)
   * @param {string} oldStatus - Previous status value
   */
  async sendComplaintStatusUpdated(user, complaint, oldStatus) {
    return this.dispatch({
      recipient: user,
      type: "COMPLAINT_STATUS_UPDATED",
      subject: `Status update for your complaint — SCMS`,
      templateName: "complaintStatusUpdated",
      templateVars: {
        userName: user.fullName,
        complaintId: complaint._id.toString().slice(-8).toUpperCase(),
        complaintTitle: complaint.title,
        complaintCategory: complaint.category,
        oldStatus,
        newStatus: complaint.status,
        updatedAt: formatDate(),
        complaintUrl: `${BASE_URL}/complaints/${complaint._id}`,
      },
      metadata: {
        complaintId: complaint._id,
        oldStatus,
        newStatus: complaint.status,
      },
    });
  }

  /**
   * Notify user that their complaint has been fully resolved.
   * @param {object} user - The complaint owner
   * @param {object} complaint - Complaint document
   */
  async sendComplaintResolved(user, complaint) {
    return this.dispatch({
      recipient: user,
      type: "COMPLAINT_RESOLVED",
      subject: `✅ Complaint resolved: ${complaint.title} — SCMS`,
      templateName: "complaintResolved",
      templateVars: {
        userName: user.fullName,
        complaintId: complaint._id.toString().slice(-8).toUpperCase(),
        complaintTitle: complaint.title,
        complaintCategory: complaint.category,
        resolvedAt: formatDate(),
        complaintUrl: `${BASE_URL}/complaints/${complaint._id}`,
      },
      metadata: { complaintId: complaint._id },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Alert admin(s) about a new complaint submission.
   * @param {object} adminUser - Admin user document
   * @param {object} complaint - New complaint document
   * @param {object} submittingUser - The user who submitted
   */
  async sendAdminNewComplaint(adminUser, complaint, submittingUser) {
    return this.dispatch({
      recipient: adminUser,
      type: "ADMIN_NEW_COMPLAINT",
      subject: `🚨 New complaint: ${complaint.title}`,
      templateName: "adminNewComplaint",
      templateVars: {
        complaintId: complaint._id.toString().slice(-8).toUpperCase(),
        complaintTitle: complaint.title,
        complaintCategory: complaint.category,
        complaintLocation: complaint.location,
        complaintPriority: complaint.priority,
        submittedBy: submittingUser.fullName,
        submittedAt: formatDate(),
        adminComplaintUrl: `${ADMIN_URL}/complaints/${complaint._id}`,
      },
      metadata: { complaintId: complaint._id, submittedBy: submittingUser._id },
    });
  }

  /**
   * Send daily summary report to admin(s).
   * @param {object} adminUser - Admin user document
   * @param {object} stats - Aggregated statistics object
   */
  async sendDailySummary(adminUser, stats) {
    const now = new Date();

    return this.dispatch({
      recipient: adminUser,
      type: "DAILY_SUMMARY",
      subject: `SCMS Daily Summary — ${now.toLocaleDateString("en-IN", { dateStyle: "medium" })}`,
      templateName: "dailySummary",
      templateVars: {
        reportDate: now.toLocaleDateString("en-IN", { dateStyle: "full" }),
        generatedAt: formatDate(now),
        totalToday: stats.totalToday ?? 0,
        totalPending: stats.totalPending ?? 0,
        totalInProgress: stats.totalInProgress ?? 0,
        totalResolved: stats.totalResolved ?? 0,
        recentComplaints: stats.recentComplaints ?? [],
        adminDashboardUrl: `${ADMIN_URL}/dashboard`,
      },
    });
  }

  /**
   * Send weekly analytics report to admin(s).
   * @param {object} adminUser - Admin user document
   * @param {object} analytics - Weekly analytics data
   */
  async sendWeeklyAnalytics(adminUser, analytics) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const total = analytics.totalComplaints || 0;
    const pending = analytics.pending || 0;
    const inProgress = analytics.inProgress || 0;
    const resolved = analytics.resolved || 0;

    const pct = (n) => Math.min(total ? Math.round((n / total) * 100) : 0, 100);

    return this.dispatch({
      recipient: adminUser,
      type: "WEEKLY_ANALYTICS",
      subject: `SCMS Weekly Analytics Report — Week of ${weekStart.toLocaleDateString("en-IN")}`,
      templateName: "weeklyAnalytics",
      templateVars: {
        weekStart: weekStart.toLocaleDateString("en-IN", {
          dateStyle: "medium",
        }),
        weekEnd: now.toLocaleDateString("en-IN", { dateStyle: "medium" }),
        generatedAt: formatDate(now),
        totalComplaints: total,
        resolutionRate: total ? ((resolved / total) * 100).toFixed(1) : "0.0",
        highPriorityCount: analytics.highPriority ?? 0,
        changePercent: analytics.changePercent ?? 0,
        pendingCount: pending,
        inProgressCount: inProgress,
        resolvedCount: resolved,
        pendingPercent: pct(pending),
        inProgressPercent: pct(inProgress),
        resolvedPercent: pct(resolved),
        topCategories:
          analytics.categoryWise?.slice(0, 5).map((c) => ({
            category: c._id || "Unknown",
            count: c.count,
          })) ?? [],
        adminAnalyticsUrl: `${ADMIN_URL}/analytics`,
      },
    });
  }
}

// Export a shared singleton
export const notificationService = new NotificationService();
