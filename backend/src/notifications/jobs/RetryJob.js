/**
 * @file RetryJob.js
 * @description Background job that retries failed email notifications.
 *
 * Design decisions:
 * - Runs every 5 minutes via node-cron
 * - Only retries notifications with status 'failed' AND retryCount < MAX_RETRIES (3)
 * - After MAX_RETRIES, status stays 'failed' — an engineer must investigate manually
 * - Processes notifications sequentially (not in parallel) to avoid thundering herd
 *   on the SMTP server if many notifications fail simultaneously
 * - Each retry increments retryCount and updates lastError on failure
 * - Successful retries set status to 'retried' (not 'sent') for audit trail clarity
 */

import cron from "node-cron";
import Notification from "../../models/Notification.js";
import { emailService } from "../services/EmailService.js";
import logger from "../../utils/logger.js";

const MAX_RETRIES = 3;

// ─── Retry executor ───────────────────────────────────────────────────────────

/**
 * Attempt to re-send a single failed notification.
 * Updates the notification document regardless of success or failure.
 *
 * @param {Notification} notification - The failed notification document
 */
const retryNotification = async (notification) => {
  logger.info({
    message: "Retrying notification",
    notificationId: notification._id,
    type: notification.type,
    retryCount: notification.retryCount + 1,
  });

  try {
    // Check metadata first, then fallback to populated recipient email
    const recipientEmail =
      notification.metadata?.recipientEmail || notification.recipient?.email;

    if (!recipientEmail) {
      // Cannot retry without a recipient — mark as permanently failed
      await Notification.findByIdAndUpdate(notification._id, {
        retryCount: MAX_RETRIES,
        lastError: "Cannot retry: recipient email not found",
      });
      logger.warn({
        message: "Cannot retry notification — recipient email missing",
        notificationId: notification._id,
      });
      return;
    }

    await emailService.send({
      to: recipientEmail,
      subject: notification.subject,
      html: notification.body,
    });

    // Success — mark as retried
    await Notification.findByIdAndUpdate(notification._id, {
      status: "retried",
      sentAt: new Date(),
      retryCount: notification.retryCount + 1,
      lastError: null,
    });

    logger.info({
      message: "Notification retry succeeded",
      notificationId: notification._id,
      type: notification.type,
      retryCount: notification.retryCount + 1,
    });
  } catch (error) {
    const newRetryCount = notification.retryCount + 1;
    const isFinalAttempt = newRetryCount >= MAX_RETRIES;

    await Notification.findByIdAndUpdate(notification._id, {
      retryCount: newRetryCount,
      lastError: error.message.substring(0, 500),
    });

    logger.error({
      message: isFinalAttempt
        ? "Notification permanently failed — max retries reached"
        : "Notification retry failed — will try again",
      notificationId: notification._id,
      type: notification.type,
      retryCount: newRetryCount,
      maxRetries: MAX_RETRIES,
      error: error.message,
    });
  }
};

// ─── Job runner ───────────────────────────────────────────────────────────────

/**
 * Find and retry all eligible failed notifications.
 * Runs sequentially to avoid SMTP overload.
 */
const runRetryJob = async () => {
  logger.debug({ message: "RetryJob: starting run" });

  try {
    const failedNotifications = await Notification.find({
      status: "failed",
      retryCount: { $lt: MAX_RETRIES },
    })
      .populate("recipient", "email")
      .sort({ failedAt: 1 });

    if (failedNotifications.length === 0) {
      logger.debug({ message: "RetryJob: no notifications to retry" });
      return;
    }

    logger.info({
      message: `RetryJob: found ${failedNotifications.length} notification(s) to retry`,
    });

    for (const notification of failedNotifications) {
      await retryNotification(notification);
    }

    logger.info({ message: "RetryJob: run complete" });
  } catch (error) {
    logger.error({ message: "RetryJob: unexpected error", error: error.message });
  }
};

// ─── Schedule ─────────────────────────────────────────────────────────────────

/**
 * Start the retry job scheduler.
 */
export const startRetryJob = () => {
  const job = cron.schedule("*/5 * * * *", runRetryJob, {
    scheduled: true,
    timezone: process.env.APP_TIMEZONE || "Asia/Kolkata",
  });

  logger.info({ message: "RetryJob: scheduled to run every 5 minutes" });

  return job;
};
