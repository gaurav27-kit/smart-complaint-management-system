/**
 * @file server.js
 * @description Application entry point — connects to MongoDB and starts Express + cron jobs.
 *
 * Startup sequence:
 * 1. Load env vars (dotenv/config)
 * 2. Connect to MongoDB
 * 3. Verify email provider connectivity
 * 4. Start background jobs (retry, scheduled reports)
 * 5. Start HTTP listener
 *
 * Graceful shutdown:
 * - On SIGTERM/SIGINT, the server stops accepting new connections, drains in-flight
 *   requests, and exits cleanly. This is critical for container deployments (Docker, K8s).
 */

import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { emailService } from "./notifications/services/EmailService.js";
import { startRetryJob } from "./notifications/jobs/RetryJob.js";
import { startScheduledJobs } from "./notifications/jobs/ScheduledJob.js";
import mongoose from "mongoose";
import { seedDepartments } from "./seeders/departmentSeeder.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

export function validateEnvironment() {
  if (process.env.NODE_ENV === "production") {
    const required = ["JWT_SECRET", "MONGO_URI"];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      const errMessage = `Production startup failure: Missing required secret(s): ${missing.join(", ")}`;
      logger.error({ message: errMessage });
      process.exit(1);
    }
  }
}

async function startServer() {
  try {
    // ─── 0. Validate Production Environment Secrets ───────────────────────────
    validateEnvironment();

    // ─── 1. Database ──────────────────────────────────────────────────────────
    await connectDB();
    logger.info({ message: "✅ Database connected successfully" });

    // Seed default departments idempotently if database is empty
    await seedDepartments().catch((err) =>
      logger.error({ message: "Error running department seeder", error: err.message })
    );

    // ─── 2. Verify email provider connection ──────────────────────────────
    emailService
      .verifyConnection()
      .then((verified) => {
        if (verified) {
          logger.info({ message: "✅ Email provider SMTP connection verified and ready" });
        } else {
          logger.error({
            message:
              "❌ Email provider SMTP verification failed! Check your `SMTP_USER` and `SMTP_PASS` (Google App Password) in `.env`.",
          });
        }
      })
      .catch((err) => {
        logger.error({
          message: "❌ Error verifying email provider connection",
          error: err.message,
        });
      });

    // ─── 3. Start background jobs ─────────────────────────────────────────────
    startRetryJob();
    startScheduledJobs();
    logger.info({ message: "✅ Background jobs started" });

    // ─── 4. Start HTTP server ─────────────────────────────────────────────────
    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info({
        message: `🚀 SCMS server running`,
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        url: `http://127.0.0.1:${PORT}`,
      });
    });

    // ─── 5. Graceful shutdown ─────────────────────────────────────────────────
    const gracefulShutdown = async (signal) => {
      logger.info({ message: `${signal} received — shutting down gracefully` });
      server.close(async () => {
        logger.info({ message: "HTTP server closed. Draining database connections..." });
        try {
          await mongoose.connection.close(false);
          logger.info({ message: "MongoDB connection closed. Process exiting cleanly." });
          process.exit(0);
        } catch (dbErr) {
          logger.error({ message: "Error closing MongoDB connection", error: dbErr.message });
          process.exit(1);
        }
      });

      // Force-exit if graceful shutdown takes too long (10s timeout)
      setTimeout(() => {
        logger.error({ message: "Forced shutdown — server did not drain in time" });
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Catch unhandled rejections — log and continue (don't crash)
    process.on("unhandledRejection", (reason) => {
      logger.error({
        message: "Unhandled Promise rejection",
        error: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    });

    // Catch uncaught exceptions — log and exit (state is potentially corrupted)
    process.on("uncaughtException", (error) => {
      logger.error({
        message: "Uncaught exception — shutting down",
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

  } catch (err) {
    logger.error({ message: "❌ Failed to start server", error: err.message, stack: err.stack });
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}