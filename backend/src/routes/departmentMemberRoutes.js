import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  addDepartmentMember,
  getDepartmentMembers,
  removeDepartmentMember,
} from "../controllers/departmentMemberController.js";

const router = express.Router({ mergeParams: true });

// ─── Department Member Routes ─────────────────────────────────────────────────

// Add a user to a department (Admin only)
router.post(
  "/:departmentId/members",
  authMiddleware,
  adminMiddleware,
  addDepartmentMember
);

// Get all members of a department (Authenticated users)
router.get(
  "/:departmentId/members",
  authMiddleware,
  getDepartmentMembers
);

// Remove a member from a department by membership ID or User ID (Admin only)
router.delete(
  "/:departmentId/members/:memberId",
  authMiddleware,
  adminMiddleware,
  (req, res, next) => {
    // Map memberId param to id and userId for seamless controller resolution
    if (req.params.memberId) {
      if (!req.params.id) req.params.id = req.params.memberId;
      if (!req.params.userId) req.params.userId = req.params.memberId;
    }
    return removeDepartmentMember(req, res, next);
  }
);

export default router;
