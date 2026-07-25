import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  getDashboardStats,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  getAnalytics,
  changePassword,
} from "../controllers/adminController.js";

const router = express.Router();


router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  getDashboardStats
);


router.get(
  "/complaints",
  authMiddleware,
  adminMiddleware,
  getAllComplaints
);


router.get(
  "/complaints/:id",
  authMiddleware,
  adminMiddleware,
  getComplaintById
);

router.patch(
  "/complaints/:id/status",
  authMiddleware,
  adminMiddleware,
  updateComplaintStatus
);

router.delete(
  "/complaints/:id",
  authMiddleware,
  adminMiddleware,
  deleteComplaint
);

router.get(
  "/analytics",
  authMiddleware,
  adminMiddleware,
  getAnalytics
);

router.patch(
  "/change-password",
  authMiddleware,
  adminMiddleware,
  changePassword
);

export default router;