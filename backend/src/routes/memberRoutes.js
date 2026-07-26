import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import {
  getMemberDashboard,
  getMemberComplaints,
  getMemberWorkload,
  getMemberNotifications,
  addMemberComplaintNote,
  uploadMemberResolutionProof,
} from "../controllers/memberController.js";

const router = express.Router();

// All member endpoints require authentication
router.use(authMiddleware);

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
 * @route   GET /api/member/workload
 * @desc    Get workload and performance metrics for authenticated member
 * @access  Private/Member
 */
router.get("/workload", getMemberWorkload);

/**
 * @route   GET /api/member/notifications
 * @desc    Get notifications for authenticated member
 * @access  Private/Member
 */
router.get("/notifications", getMemberNotifications);

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
router.post("/complaints/:id/proof", upload, uploadMemberResolutionProof);

export default router;
