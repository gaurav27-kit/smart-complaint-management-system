import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { analyzeComplaint } from "../controllers/aiController.js";

const router = express.Router();

// Apply auth middleware since only logged-in users should access AI features
router.post("/analyze-complaint", authMiddleware, analyzeComplaint);

export default router;
