/**
 * @file ScheduledJob.js
 * @description Scheduled email dispatch jobs for daily summaries and weekly analytics.
 *
 * Schedule:
 * - Daily Summary:    8:00 AM every day
 * - Weekly Analytics: 9:00 AM every Monday
 *
 * Design decisions:
 * - Admin users are fetched from DB at job runtime (not cached) to pick up new admins
 *   added after server start
 * - If no admins exist, the job logs a warning and exits gracefully
 * - Stats are computed fresh at runtime — no stale data
 * - Jobs are independent; a crash in one doesn't affect the other
 */

import cron from "node-cron";
import User from "../../models/User.js";
import Complaint from "../../models/Complaint.js";
import { notificationService } from "../services/NotificationService.js";
import logger from "../../utils/logger.js";

// ─── Data aggregators ─────────────────────────────────────────────────────────

/**
 * Gather statistics for the daily summary email.
 * @returns {Promise<object>}
 */
const getDailySummaryStats = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalToday, totalPending, totalInProgress, totalResolved, recentComplaints] =
    await Promise.all([
      Complaint.countDocuments({ createdAt: { $gte: startOfToday } }),
      Complaint.countDocuments({ status: "Pending" }),
      Complaint.countDocuments({ status: "In Progress" }),
      Complaint.countDocuments({ status: "Resolved" }),
      // Last 10 complaints created today — for the summary table
      Complaint.find({ createdAt: { $gte: startOfToday } })
        .select("title category priority status")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

  return {
    totalToday,
    totalPending,
    totalInProgress,
    totalResolved,
    recentComplaints,
  };
};

/**
 * Gather statistics for the weekly analytics email.
 * @returns {Promise<object>}
 */
const getWeeklyAnalyticsStats = async () => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const dateFilter = { createdAt: { $gte: startOfWeek } };

  const [total, pending, inProgress, resolved, highPriority, categoryWise] =
    await Promise.all([
      Complaint.countDocuments(dateFilter),
      Complaint.countDocuments({ ...dateFilter, status: "Pending" }),
      Complaint.countDocuments({ ...dateFilter, status: "In Progress" }),
      Complaint.countDocuments({ ...dateFilter, status: "Resolved" }),
      Complaint.countDocuments({ ...dateFilter, priority: "High" }),
      Complaint.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

  // Simplified week-over-week change (placeholder — implement proper comparison if needed)
  const changePercent = "+0";

  return {
    totalComplaints: total,
    pending,
    inProgress,
    resolved,
    highPriority,
    changePercent,
    categoryWise,
  };
};

// ─── Job runners ──────────────────────────────────────────────────────────────

const runDailySummaryJob = async () => {
  logger.info({ message: "ScheduledJob: running daily summary" });

  try {
    const admins = await User.find({ role: "admin" }).select("_id email fullName").lean();

    if (admins.length === 0) {
      logger.warn({ message: "ScheduledJob: no admin users found — skipping daily summary" });
      return;
    }

    const stats = await getDailySummaryStats();

    // Send to all admins concurrently (they each get their own notification record)
    await Promise.allSettled(
      admins.map((admin) => notificationService.sendDailySummary(admin, stats)),
    );

    logger.info({
      message: "ScheduledJob: daily summary dispatched",
      adminCount: admins.length,
    });
  } catch (error) {
    logger.error({ message: "ScheduledJob: daily summary failed", error: error.message });
  }
};

const runWeeklyAnalyticsJob = async () => {
  logger.info({ message: "ScheduledJob: running weekly analytics" });

  try {
    const admins = await User.find({ role: "admin" }).select("_id email fullName").lean();

    if (admins.length === 0) {
      logger.warn({ message: "ScheduledJob: no admin users found — skipping weekly analytics" });
      return;
    }

    const analytics = await getWeeklyAnalyticsStats();

    await Promise.allSettled(
      admins.map((admin) => notificationService.sendWeeklyAnalytics(admin, analytics)),
    );

    logger.info({
      message: "ScheduledJob: weekly analytics dispatched",
      adminCount: admins.length,
    });
  } catch (error) {
    logger.error({ message: "ScheduledJob: weekly analytics failed", error: error.message });
  }
};

// ─── Scheduler ────────────────────────────────────────────────────────────────

/**
 * Start all scheduled notification jobs.
 * Call once from server.js after database connection is established.
 */
export const startScheduledJobs = () => {
  // Daily summary at 8:00 AM
  cron.schedule("0 8 * * *", runDailySummaryJob, {
    scheduled: true,
    timezone: process.env.APP_TIMEZONE || "Asia/Kolkata",
  });

  // Weekly analytics every Monday at 9:00 AM
  cron.schedule("0 9 * * 1", runWeeklyAnalyticsJob, {
    scheduled: true,
    timezone: process.env.APP_TIMEZONE || "Asia/Kolkata",
  });

  logger.info({
    message: "ScheduledJobs: registered",
    jobs: ["Daily Summary @ 08:00", "Weekly Analytics @ Monday 09:00"],
  });
};

// ─── Manual triggers (for API-driven dispatch) ────────────────────────────────
export { runDailySummaryJob, runWeeklyAnalyticsJob };
