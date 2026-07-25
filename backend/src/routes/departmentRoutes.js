import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";

const router = express.Router();

// ─── Public/User Department Routes (Authenticated) ───────────────────────────
router.get("/", authMiddleware, getAllDepartments);
router.get("/:id", authMiddleware, getDepartmentById);

// ─── Admin Only Department Routes ─────────────────────────────────────────────
router.post("/", authMiddleware, adminMiddleware, createDepartment);
router.put("/:id", authMiddleware, adminMiddleware, updateDepartment);
router.delete("/:id", authMiddleware, adminMiddleware, deleteDepartment);

export default router;
