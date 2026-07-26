import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import upload from "../middleware/upload.js";
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getComplaintTimeline,
  updateComplaint,
  deleteComplaint,
  assignDepartment,
  assignComplaintToMember,
  updateComplaintStatus,
} from "../controllers/complaintController.js";

const router = express.Router();

router.post("/", authMiddleware, upload, createComplaint);
router.get("/", authMiddleware, getMyComplaints);
router.get("/:id", authMiddleware, getComplaintById);
router.get("/:id/timeline", authMiddleware, getComplaintTimeline);

router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  updateComplaintStatus,
);
router.patch(
  "/:id/assign-department",
  authMiddleware,
  adminMiddleware,
  assignDepartment,
);
router.patch(
  "/:id/assign-member",
  authMiddleware,
  adminMiddleware,
  assignComplaintToMember,
);

// Support both PUT and PATCH for backward compatibility; PATCH is preferred
router.patch("/:id", authMiddleware, upload, updateComplaint);
router.put("/:id", authMiddleware, upload, updateComplaint);

router.delete("/:id", authMiddleware, deleteComplaint);

export default router;
