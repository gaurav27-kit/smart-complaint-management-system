import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { aiAnalyzeSchema } from "../validators/schemas.js";
import { analyzeComplaint } from "../controllers/aiController.js";

const router = express.Router();

// Apply auth middleware, rate limiting, and Zod validation
router.post(
  "/analyze-complaint",
  authMiddleware,
  aiLimiter,
  validate(aiAnalyzeSchema),
  analyzeComplaint
);

export default router;
