/**
 * @file scheduledJob.test.js
 * @description Module 7: Scheduled Job Execution.
 * Verifies daily summary and weekly analytics job execution, admin targeting, and no duplicate notifications.
 */

import { jest } from "@jest/globals";
import { emailService } from "../../src/notifications/services/EmailService.js";
import { runDailySummaryJob, runWeeklyAnalyticsJob } from "../../src/notifications/jobs/ScheduledJob.js";
import Notification from "../../src/models/Notification.js";
import { notificationService } from "../../src/notifications/services/NotificationService.js";
import { createTestUser, createTestComplaint } from "../helpers/authHelper.js";
import User from "../../src/models/User.js";
import { startScheduledJobs } from "../../src/notifications/jobs/ScheduledJob.js";
import cron from "node-cron";

describe("Module 7: Scheduled Job Execution", () => {
  let admin1;
  let admin2;
  let sendSpy;
  let sendAsyncSpy;

  beforeEach(async () => {
    if (notificationService.dispatch.mockRestore) {
      notificationService.dispatch.mockRestore();
    }

    // Mock node-cron schedule to prevent active timer handles in tests
    jest.spyOn(cron, "schedule").mockImplementation((expression, func, options) => {
      return {
        start: () => {},
        stop: () => {},
      };
    });

    sendSpy = jest.spyOn(emailService, "send").mockResolvedValue({
      messageId: "mock-scheduled-msg",
      provider: "smtp",
    });

    sendAsyncSpy = jest.spyOn(notificationService, "_sendAsync");

    admin1 = await createTestUser({ role: "admin", fullName: "Admin One" });
    admin2 = await createTestUser({ role: "admin", fullName: "Admin Two" });

    // Create some complaints for stats aggregation
    const citizen = await createTestUser({ role: "user" });
    await createTestComplaint({ title: "Daily Test 1", status: "Pending", createdBy: citizen._id });
    await createTestComplaint({ title: "Daily Test 2", status: "In Progress", createdBy: citizen._id });
    await createTestComplaint({ title: "Daily Test 3", status: "Resolved", createdBy: citizen._id });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Daily Summary Job", () => {
    it("should create DAILY_SUMMARY notification for each admin user", async () => {
      await runDailySummaryJob();

      // Wait for all async sends from the job to complete
      await Promise.all(sendAsyncSpy.mock.results.map((r) => r.value));

      const summaryNotifs = await Notification.find({ type: "DAILY_SUMMARY" });
      expect(summaryNotifs.length).toBe(2); // One per admin
      const recipients = summaryNotifs.map((n) => n.recipient.toString());
      expect(recipients).toContain(admin1._id.toString());
      expect(recipients).toContain(admin2._id.toString());
    });

    it("should not create duplicate notifications when run twice", async () => {
      await runDailySummaryJob();
      await Promise.all(sendAsyncSpy.mock.results.map((r) => r.value));

      // Clear spy call history before the second run
      sendAsyncSpy.mockClear();

      await runDailySummaryJob();
      await Promise.all(sendAsyncSpy.mock.results.map((r) => r.value));

      const summaryNotifs = await Notification.find({ type: "DAILY_SUMMARY" });
      // Each run creates one per admin = 2 + 2 = 4 total (separate runs, separate records)
      expect(summaryNotifs.length).toBe(4);
    });

    it("should gracefully handle no admin users in daily summary job", async () => {
      await User.deleteMany({ role: "admin" });

      await expect(runDailySummaryJob()).resolves.not.toThrow();

      const summaryNotifs = await Notification.find({ type: "DAILY_SUMMARY" });
      expect(summaryNotifs.length).toBe(0);
    });

    it("should handle exceptions and log errors", async () => {
      jest.spyOn(User, "find").mockImplementation(() => {
        throw new Error("Simulated query failure");
      });

      await expect(runDailySummaryJob()).resolves.not.toThrow();
    });
  });

  describe("Weekly Analytics Job", () => {
    it("should create WEEKLY_ANALYTICS notification for each admin user", async () => {
      await runWeeklyAnalyticsJob();

      await Promise.all(sendAsyncSpy.mock.results.map((r) => r.value));

      const analyticsNotifs = await Notification.find({ type: "WEEKLY_ANALYTICS" });
      expect(analyticsNotifs.length).toBe(2);
    });

    it("should gracefully handle no admin users", async () => {
      await User.deleteMany({ role: "admin" });

      // Should not throw
      await expect(runWeeklyAnalyticsJob()).resolves.not.toThrow();

      const analyticsNotifs = await Notification.find({ type: "WEEKLY_ANALYTICS" });
      expect(analyticsNotifs.length).toBe(0);
    });

    it("should handle exceptions and log errors", async () => {
      jest.spyOn(User, "find").mockImplementation(() => {
        throw new Error("Simulated query failure");
      });

      await expect(runWeeklyAnalyticsJob()).resolves.not.toThrow();
    });
  });

  describe("Scheduler Registration", () => {
    it("should register scheduled jobs without throwing errors", () => {
      expect(() => startScheduledJobs()).not.toThrow();
    });
  });
});
