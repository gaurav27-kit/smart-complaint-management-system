/**
 * @file notificationFailure.test.js
 * @description Module 6 & 10: Retry Logic & Failure Recovery.
 * Verifies notification persistence on SMTP failure, retry count, status transitions, and app stability.
 */

import { jest } from "@jest/globals";
import { notificationService } from "../../src/notifications/services/NotificationService.js";
import { emailService } from "../../src/notifications/services/EmailService.js";
import Notification from "../../src/models/Notification.js";
import { createTestUser, createTestComplaint } from "../helpers/authHelper.js";

describe("Module 6 & 10: Retry Logic & Failure Recovery", () => {
  let citizen;
  let complaint;

  let sendAsyncSpy;

  beforeEach(async () => {
    if (notificationService.dispatch.mockRestore) {
      notificationService.dispatch.mockRestore();
    }
    sendAsyncSpy = jest.spyOn(notificationService, "_sendAsync");
    citizen = await createTestUser({ role: "user", fullName: "Retry Citizen" });
    complaint = await createTestComplaint({
      title: "Garbage Overflow",
      category: "Garbage",
      createdBy: citizen._id,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should persist notification with 'pending' status even when SMTP fails", async () => {
    // Mock SMTP to reject
    const sendSpy = jest.spyOn(emailService, "send").mockRejectedValue(new Error("SMTP connection refused"));

    const notification = await notificationService.sendComplaintSubmitted(citizen, complaint);

    // dispatch() returns the notification BEFORE _sendAsync runs
    expect(notification).toBeDefined();
    expect(notification.status).toBe("pending");

    const dbNotif = await Notification.findById(notification._id);
    expect(dbNotif).toBeDefined();
    expect(dbNotif.type).toBe("COMPLAINT_SUBMITTED");

    // Wait for the background _sendAsync execution
    if (sendAsyncSpy.mock.results.length > 0) {
      await sendAsyncSpy.mock.results[0].value;
    }

    // After _sendAsync, status should be 'failed'
    const updatedNotif = await Notification.findById(notification._id);
    expect(updatedNotif.status).toBe("failed");
    expect(updatedNotif.lastError).toContain("SMTP connection refused");
  });

  it("should update notification to 'sent' status when SMTP succeeds", async () => {
    const sendSpy = jest.spyOn(emailService, "send").mockResolvedValue({
      messageId: "mock-success-id",
      provider: "smtp",
    });

    const notification = await notificationService.sendComplaintSubmitted(citizen, complaint);

    // Wait for the background _sendAsync execution
    if (sendAsyncSpy.mock.results.length > 0) {
      await sendAsyncSpy.mock.results[0].value;
    }

    const dbNotif = await Notification.findById(notification._id);
    expect(dbNotif.status).toBe("sent");
    expect(dbNotif.sentAt).toBeDefined();
    expect(dbNotif.providerMessageId).toBe("mock-success-id");
  });

  it("should find retryable notifications using static method findRetryable()", async () => {
    // Create a failed notification directly
    await Notification.create({
      recipient: citizen._id,
      type: "COMPLAINT_SUBMITTED",
      channel: "email",
      status: "failed",
      subject: "Failed Notif",
      title: "Failed Notif",
      message: "Test",
      provider: "smtp",
      retryCount: 1,
      failedAt: new Date(),
      lastError: "SMTP timeout",
    });

    const retryable = await Notification.findRetryable(3);
    expect(retryable.length).toBeGreaterThanOrEqual(1);
    expect(retryable[0].status).toBe("failed");
    expect(retryable[0].retryCount).toBeLessThan(3);
  });

  it("should not include notifications that have exhausted max retries", async () => {
    await Notification.create({
      recipient: citizen._id,
      type: "COMPLAINT_SUBMITTED",
      channel: "email",
      status: "failed",
      subject: "Exhausted Retries",
      title: "Exhausted",
      message: "Test",
      provider: "smtp",
      retryCount: 3,
      failedAt: new Date(),
    });

    const retryable = await Notification.findRetryable(3);
    const exhausted = retryable.find((n) => n.retryCount >= 3);
    expect(exhausted).toBeUndefined();
  });
});
