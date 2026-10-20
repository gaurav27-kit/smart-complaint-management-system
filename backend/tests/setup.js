/**
 * @file setup.js
 * @description Global Jest environment setup for MongoMemoryServer lifecycle, DB cleanup, and mocking external notifications.
 */

import dotenv from "dotenv";
import { jest } from "@jest/globals";
import { connectTestDB, clearTestDB, closeTestDB } from "./helpers/dbHelper.js";
import { notificationService } from "../src/notifications/services/NotificationService.js";

// Load test environment variables before anything else
dotenv.config({ path: ".env.test" });

beforeAll(async () => {
  await connectTestDB();
}, 30000);

beforeEach(() => {
  // Safely mock notification dispatch methods to prevent SMTP network calls during test runs
  if (typeof notificationService.dispatch === "function") {
    jest.spyOn(notificationService, "dispatch").mockImplementation(() => Promise.resolve());
  }
  if (typeof notificationService.sendEmailVerification === "function") {
    jest.spyOn(notificationService, "sendEmailVerification").mockImplementation(() => Promise.resolve());
  }
  if (typeof notificationService.sendPasswordReset === "function") {
    jest.spyOn(notificationService, "sendPasswordReset").mockImplementation(() => Promise.resolve());
  }
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
}, 30000);
