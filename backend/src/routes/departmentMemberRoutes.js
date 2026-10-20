import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { adminOrHeadMiddleware } from "../middleware/adminOrHeadMiddleware.js";
import {
  addDepartmentMember,
  getDepartmentMembers,
  removeDepartmentMember,
  reactivateDepartmentMember,
} from "../controllers/departmentMemberController.js";

const router = express.Router({ mergeParams: true });

// ─── Department Member Routes ─────────────────────────────────────────────────

// Create/Add a department member (Admin or Department Head)
router.post(
  "/members",
  authMiddleware,
  adminOrHeadMiddleware,
  addDepartmentMember
);
router.post(
  "/:departmentId/members",
  authMiddleware,
  adminOrHeadMiddleware,
  addDepartmentMember
);

// Get all active department members (Authenticated users)
router.get(
  "/members",
  authMiddleware,
  getDepartmentMembers
);
router.get(
  "/:departmentId/members",
  authMiddleware,
  getDepartmentMembers
);

// Reactivate a soft-deleted department member (Admin or Department Head)
router.patch(
  "/members/:memberId/reactivate",
  authMiddleware,
  adminOrHeadMiddleware,
  reactivateDepartmentMember
);

// Remove (Soft Delete) a member from a department (Admin or Department Head)
router.delete(
  "/members/:memberId",
  authMiddleware,
  adminOrHeadMiddleware,
  removeDepartmentMember
);
router.delete(
  "/:departmentId/members/:memberId",
  authMiddleware,
  adminOrHeadMiddleware,
  removeDepartmentMember
);

export default router;
