/**
 * @file notificationRoutes.js
 * @description Routes for notification management.
 *
 * Route structure:
 *   GET    /api/notifications              — user's own notification history
 *   GET    /api/notifications/admin        — all notifications (admin only)
 *   GET    /api/notifications/stats        — delivery statistics (admin only)
 *   POST   /api/notifications/retry/:id   — manual retry (admin only)
 *   DELETE /api/notifications/:id         — delete record (admin only)
 *   POST   /api/notifications/send-daily-summary    — manual trigger (admin only)
 *   POST   /api/notifications/send-weekly-analytics — manual trigger (admin only)
 */

import express from "express";
import {
  getMyNotifications,
  getAllNotifications,
  getNotificationStats,
  retryNotification,
  deleteNotification,
  triggerDailySummary,
  triggerWeeklyAnalytics,
} from "../controllers/notificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { apiLimiter, adminLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ─── User routes ──────────────────────────────────────────────────────────────
router.get("/", apiLimiter, getMyNotifications);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.use(adminMiddleware); // All routes below require admin role

router.get("/admin", adminLimiter, getAllNotifications);
router.get("/stats", adminLimiter, getNotificationStats);
router.post("/retry/:id", adminLimiter, retryNotification);
router.delete("/:id", adminLimiter, deleteNotification);

// Scheduled job manual triggers
router.post("/send-daily-summary", adminLimiter, triggerDailySummary);
router.post("/send-weekly-analytics", adminLimiter, triggerWeeklyAnalytics);

export default router;
