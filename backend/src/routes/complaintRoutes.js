import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import upload from "../middleware/upload.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
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
import { validate } from "../middleware/validate.js";
import {
  createComplaintSchema,
  updateComplaintStatusSchema,
  assignComplaintSchema,
} from "../validators/schemas.js";

const router = express.Router();

router.post("/", authMiddleware, uploadLimiter, upload, validate(createComplaintSchema), createComplaint);
router.get("/", authMiddleware, getMyComplaints);
router.get("/:id", authMiddleware, getComplaintById);
router.get("/:id/timeline", authMiddleware, getComplaintTimeline);

router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  validate(updateComplaintStatusSchema),
  updateComplaintStatus,
);
router.patch(
  "/:id/assign-department",
  authMiddleware,
  adminMiddleware,
  validate(assignComplaintSchema),
  assignDepartment,
);
router.patch(
  "/:id/assign-member",
  authMiddleware,
  adminMiddleware,
  validate(assignComplaintSchema),
  assignComplaintToMember,
);

// Support both PUT and PATCH for backward compatibility; PATCH is preferred
router.patch("/:id", authMiddleware, uploadLimiter, upload, updateComplaint);
router.put("/:id", authMiddleware, uploadLimiter, upload, updateComplaint);

router.delete("/:id", authMiddleware, deleteComplaint);

export default router;
