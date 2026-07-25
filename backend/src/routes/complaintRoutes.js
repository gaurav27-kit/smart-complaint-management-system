import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getComplaintTimeline,
  updateComplaint,
  deleteComplaint,
} from "../controllers/complaintController.js";

const router = express.Router();

router.post("/", authMiddleware, upload, createComplaint);
router.get("/", authMiddleware, getMyComplaints);
router.get("/:id", authMiddleware, getComplaintById);
router.get("/:id/timeline", authMiddleware, getComplaintTimeline);

// Support both PUT and PATCH for backward compatibility; PATCH is preferred
router.patch("/:id", authMiddleware, upload, updateComplaint);
router.put("/:id", authMiddleware, upload, updateComplaint);

router.delete("/:id", authMiddleware, deleteComplaint);

export default router;