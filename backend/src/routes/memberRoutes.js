import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import { getComplaintById } from "../controllers/complaintController.js";
import {
  getMemberDashboard,
  getMemberComplaints,
  getMemberWorkload,
  getMemberNotifications,
  markMemberNotificationRead,
  markAllMemberNotificationsRead,
  addMemberComplaintNote,
  uploadMemberResolutionProof,
  assignMemberComplaint,
  getDepartmentOfficers,
  getMemberProfile,
  updateMemberComplaintStatus,
  changeMemberPassword,
} from "../controllers/memberController.js";

import { validate } from "../middleware/validate.js";
import {
  updateComplaintStatusSchema,
  assignComplaintSchema,
} from "../validators/schemas.js";

const router = express.Router();

// All member endpoints require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/member/profile
 * @desc    Get authenticated Department Member profile & deptRole
 * @access  Private/Member
 */
router.get("/profile", getMemberProfile);

/**
 * @route   GET /api/member/dashboard
 * @desc    Get dashboard metrics scoped to authenticated member
 * @access  Private/Member
 */
router.get("/dashboard", getMemberDashboard);

/**
 * @route   GET /api/member/complaints
 * @desc    Get complaints assigned to authenticated member
 * @access  Private/Member
 */
router.get("/complaints", getMemberComplaints);

/**
 * @route   GET /api/member/complaints/:id
 * @desc    Get specific complaint details authorized for authenticated member
 * @access  Private/Member
 */
router.get("/complaints/:id", getComplaintById);

/**
 * @route   GET /api/member/workload
 * @desc    Get workload and performance metrics for authenticated member
 * @access  Private/Member
 */
router.get("/workload", getMemberWorkload);

/**
 * @route   GET /api/member/officers
 * @desc    Get field officers in HEAD's department (HEAD only)
 * @access  Private/Member (HEAD only)
 */
router.get("/officers", getDepartmentOfficers);

/**
 * @route   GET /api/member/notifications
 * @desc    Get notifications for authenticated member
 * @access  Private/Member
 */
router.get("/notifications", getMemberNotifications);

/**
 * @route   PATCH /api/member/notifications/read-all
 * @desc    Mark all unread notifications as read
 * @access  Private/Member
 */
router.patch("/notifications/read-all", markAllMemberNotificationsRead);

/**
 * @route   PATCH /api/member/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private/Member
 */
router.patch("/notifications/:id/read", markMemberNotificationRead);

/**
 * @route   PATCH /api/member/complaints/:id/assign
 * @desc    Assign / Reassign a complaint to a Field Officer (HEAD only)
 * @access  Private/Member (HEAD only)
 */
router.patch("/complaints/:id/assign", validate(assignComplaintSchema), assignMemberComplaint);

/**
 * @route   POST /api/member/complaints/:id/notes
 * @desc    Add an internal resolution note to a complaint
 * @access  Private/Member
 */
router.post("/complaints/:id/notes", addMemberComplaintNote);

/**
 * @route   POST /api/member/complaints/:id/proof
 * @desc    Upload resolution proof files (images/PDF) for a complaint
 * @access  Private/Member
 */
router.post("/complaints/:id/proof", uploadLimiter, upload, uploadMemberResolutionProof);

/**
 * @route   PATCH /api/member/complaints/:id/status
 * @desc    Update complaint status (authorized for member)
 * @access  Private/Member
 */
router.patch("/complaints/:id/status", validate(updateComplaintStatusSchema), updateMemberComplaintStatus);

/**
 * @route   PATCH /api/member/change-password
 * @desc    Change password for authenticated Department Member
 * @access  Private/Member
 */
router.patch("/change-password", changeMemberPassword);

export default router;
