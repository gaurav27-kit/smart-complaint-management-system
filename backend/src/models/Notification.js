/**
 * @file Notification.js
 * @description MongoDB schema for tracking every notification dispatched by the system.
 *
 * Design decisions:
 * - Every notification attempt is persisted BEFORE sending — guarantees we can retry
 *   if the process crashes mid-send
 * - Status transitions: pending → sent | failed → retried (up to MAX_RETRIES)
 * - `body` stores rendered HTML — useful for debugging delivery issues without
 *   re-rendering the template
 * - `metadata` (Mixed) stores business context (complaintId, oldStatus, etc.)
 *   allowing future analytics without schema changes
 * - TTL index auto-purges old sent notifications after 90 days to control DB growth
 *
 * Future BullMQ integration:
 * - `jobId` field can be populated when the notification is queued to a Bull queue,
 *   enabling job-level status tracking alongside this DB record
 */

import mongoose from "mongoose";

const NOTIFICATION_TYPES = [
  "EMAIL_VERIFICATION",
  "WELCOME",
  "FORGOT_PASSWORD",
  "PASSWORD_RESET_SUCCESS",
  "COMPLAINT_SUBMITTED",
  "COMPLAINT_ASSIGNED",
  "COMPLAINT_STATUS_UPDATED",
  "COMPLAINT_RESOLVED",
  "ADMIN_NEW_COMPLAINT",
  "DAILY_SUMMARY",
  "WEEKLY_ANALYTICS",
];

const NOTIFICATION_CHANNELS = ["email", "sms", "push"];

const NOTIFICATION_STATUSES = ["pending", "sent", "failed", "retried"];

const PROVIDERS = ["smtp", "resend", "sendgrid", "ses"];

const notificationSchema = new mongoose.Schema(
  {
    // The user who should receive this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },

    channel: {
      type: String,
      enum: NOTIFICATION_CHANNELS,
      default: "email",
    },

    status: {
      type: String,
      enum: NOTIFICATION_STATUSES,
      default: "pending",
      index: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    // Rendered HTML body — stored for audit and debugging purposes
    body: {
      type: String,
    },

    // Which provider was used / attempted
    provider: {
      type: String,
      enum: PROVIDERS,
      required: true,
    },

    // Provider-assigned message ID (e.g., Nodemailer messageId, Resend ID)
    providerMessageId: {
      type: String,
    },

    // Number of delivery attempts made (initial send counts as attempt 1 on failure)
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 3, // MAX_RETRIES — beyond this, we alert a human
    },

    // Last error message — helps engineers debug delivery failures without reading logs
    lastError: {
      type: String,
    },

    // Flexible metadata for business context — never reshapes the schema
    // Examples: { complaintId, oldStatus, newStatus, assignedBy }
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // For scheduled notifications dispatched via cron / BullMQ delay
    scheduledAt: {
      type: Date,
    },

    sentAt: {
      type: Date,
    },

    failedAt: {
      type: Date,
    },

    // Reserved for future BullMQ job reference
    jobId: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Compound index for the retry job: finds failed notifications efficiently
notificationSchema.index({ status: 1, retryCount: 1, failedAt: 1 });

// Compound index for user notification history queries
notificationSchema.index({ recipient: 1, createdAt: -1 });

// TTL index: auto-delete sent notifications older than 90 days
// Only applied to documents with `sentAt` set — pending/failed are retained
notificationSchema.index(
  { sentAt: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
    partialFilterExpression: { status: "sent" },
    name: "sent_notifications_ttl",
  },
);

// ─── Statics ─────────────────────────────────────────────────────────────────

/**
 * Find notifications eligible for retry.
 * Criteria: status is 'failed' AND retryCount is below the max threshold.
 */
notificationSchema.statics.findRetryable = function (maxRetries = 3) {
  return this.find({
    status: "failed",
    retryCount: { $lt: maxRetries },
  }).sort({ failedAt: 1 }); // Oldest failures first
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
export { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES };
