/**
 * @file dashboardRoutes.js
 * @description Admin Dashboard router definitions.
 */

import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  getAdminDashboard,
  getDepartmentDashboard,
  getOfficerWorkloadDashboard,
  getMonthlyComplaintTrends,
} from "../controllers/dashboardController.js";

const router = express.Router();

// Protect all dashboard routes with auth and admin middleware
router.use(authMiddleware, adminMiddleware);

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard metrics
 * @access  Private/Admin
 */
router.get("/admin", getAdminDashboard);

/**
 * @route   GET /api/dashboard/departments
 * @desc    Get department-wise complaint statistics
 * @access  Private/Admin
 */
router.get("/departments", getDepartmentDashboard);

/**
 * @route   GET /api/dashboard/workload
 * @desc    Get officer workload dashboard statistics
 * @access  Private/Admin
 */
router.get("/workload", getOfficerWorkloadDashboard);

/**
 * @route   GET /api/dashboard/monthly
 * @desc    Get monthly complaint trends
 * @access  Private/Admin
 */
router.get("/monthly", getMonthlyComplaintTrends);

export default router;
