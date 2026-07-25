/**
 * @file logger.js
 * @description Centralized structured logging using Winston.
 *
 * Design decisions:
 * - JSON format in production → parsable by log aggregators (Datadog, CloudWatch, ELK)
 * - Colorized simple format in development → human-readable
 * - LOG_LEVEL env var allows runtime verbosity control without code change
 * - `service` metadata on every log → easy filtering in multi-service setups
 * - File transports only in production to avoid cluttering dev environments
 */

import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, errors, json, colorize, printf, metadata } =
  winston.format;

const isProduction = process.env.NODE_ENV === "production";

// ─── Log directory (production only) ────────────────────────────────────────
const LOG_DIR = path.join(__dirname, "../../logs");
if (isProduction && !fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ─── Development format: colorized, human-readable ──────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr =
      Object.keys(meta).length > 0 ? `\n  ${JSON.stringify(meta)}` : "";
    return `${ts} [${level}]: ${stack || message}${metaStr}`;
  }),
);

// ─── Production format: structured JSON ─────────────────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  metadata({ fillExcept: ["message", "level", "timestamp", "service"] }),
  json(),
);

// ─── Transports ─────────────────────────────────────────────────────────────
const transports = [new winston.transports.Console()];

if (isProduction) {
  transports.push(
    // Only error-level logs in error.log
    new winston.transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
      maxsize: 10 * 1024 * 1024, // 10 MB rotation
      maxFiles: 5,
    }),
    // All logs in combined.log
    new winston.transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
      maxsize: 20 * 1024 * 1024,
      maxFiles: 10,
    }),
  );
}

// ─── Logger instance ─────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  format: isProduction ? prodFormat : devFormat,
  defaultMeta: { service: "scms-backend" },
  transports,
  // Prevent logger itself from crashing on uncaught errors
  exitOnError: false,
});

export default logger;
