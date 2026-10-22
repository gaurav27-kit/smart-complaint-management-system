/**
 * @file app.js
 * @description Express application setup with all middleware, routes, and error handling.
 *
 * Changes from original:
 * - Added notification routes
 * - Replaced console.log request logger with Winston-based structured logging
 * - Added centralized error handler as the FINAL middleware (required by Express)
 * - Added security headers with helmet (if installed) — left as comment for now
 * - 404 handler for unmatched routes with ApiError
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import departmentMemberRoutes from "./routes/departmentMemberRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ApiError } from "./utils/apiError.js";
import logger from "./utils/logger.js";

const app = express();

// ─── Trust Proxy Configuration ────────────────────────────────────────────────
// In production behind reverse proxies (Nginx, Docker, Cloudflare),
// TRUST_PROXY enables express-rate-limit to extract the real client IP.
const trustProxyEnv = process.env.TRUST_PROXY;
if (trustProxyEnv !== undefined) {
  if (trustProxyEnv === "true") app.set("trust proxy", true);
  else if (trustProxyEnv === "false") app.set("trust proxy", false);
  else if (!isNaN(Number(trustProxyEnv))) app.set("trust proxy", Number(trustProxyEnv));
  else app.set("trust proxy", trustProxyEnv);
} else if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set(
    [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      ...configuredOrigins,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ].filter(Boolean)
  )
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server, health checks)
      if (!origin) {
        return callback(null, true);
      }

      const isVercelDeploy =
        origin.endsWith(".vercel.app") && origin.includes("smart-complaint");

      if (allowedOrigins.includes(origin) || isVercelDeploy) {
        return callback(null, true);
      }

      callback(ApiError.forbidden(`CORS policy does not allow access from origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // Set limit to prevent DoS via huge payloads
app.use(cookieParser());

// ─── Request Logging ──────────────────────────────────────────────────────────
// Replaced console.log with Winston structured logging for production readiness
app.use((req, res, next) => {
  const startTime = Date.now();

  // Log the response after it's sent (captures actual status code and response time)
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get("user-agent")?.substring(0, 100), // Truncate to prevent log bloat
    };

    // 4xx and 5xx log at warn/error level; everything else is info
    if (res.statusCode >= 500) {
      logger.error({ message: "Request completed with server error", ...logData });
    } else if (res.statusCode >= 400) {
      logger.warn({ message: "Request completed with client error", ...logData });
    } else {
      logger.info({ message: "Request completed", ...logData });
    }
  });

  next();
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/departments", departmentMemberRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/member", memberRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SCMS Backend Running Successfully 🚀",
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// ─── Protected Profile Route ──────────────────────────────────────────────────
app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Protected route accessed successfully!",
    user: req.user,
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
// Must come AFTER all route registrations
app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be the LAST middleware registered (Express requires 4-arg signature)
app.use(errorHandler);

export default app;
