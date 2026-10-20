/**
 * @file retryJob.test.js
 * @description Module 6 (continued): Admin Manual Retry via API.
 * Tests POST /api/notifications/retry/:id for failed notification resend.
 */

import { jest } from "@jest/globals";
import request from "supertest";
import app from "../helpers/testApp.js";
import { emailService } from "../../src/notifications/services/EmailService.js";
import Notification from "../../src/models/Notification.js";
import { createTestUser, generateTestToken } from "../helpers/authHelper.js";

describe("Module 6: Admin Manual Retry via API", () => {
  let adminUser;
  let adminToken;
  let citizenUser;
  let failedNotification;

  beforeEach(async () => {
    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });
    citizenUser = await createTestUser({ role: "user" });

    failedNotification = await Notification.create({
      recipient: citizenUser._id,
      type: "COMPLAINT_SUBMITTED",
      channel: "email",
      status: "failed",
      subject: "Failed Delivery Test",
      title: "Failed Delivery",
      message: "Test message",
      body: "<html><body>Test HTML</body></html>",
      provider: "smtp",
      retryCount: 0,
      failedAt: new Date(),
      lastError: "SMTP connection timeout",
      metadata: { recipientEmail: citizenUser.email },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should retry a failed notification successfully (200 OK)", async () => {
    jest.spyOn(emailService, "send").mockResolvedValue({
      messageId: "retry-success-msg-id",
      provider: "smtp",
    });

    const response = await request(app)
      .post(`/api/notifications/retry/${failedNotification._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const dbNotif = await Notification.findById(failedNotification._id);
    expect(dbNotif.status).toBe("retried");
    expect(dbNotif.retryCount).toBe(1);
    expect(dbNotif.providerMessageId).toBe("retry-success-msg-id");
    expect(dbNotif.lastError).toBeNull();
  });

  it("should reject retry of a non-failed notification (400 Bad Request)", async () => {
    const sentNotif = await Notification.create({
      recipient: citizenUser._id,
      type: "COMPLAINT_SUBMITTED",
      channel: "email",
      status: "sent",
      subject: "Already Sent",
      title: "Already Sent",
      message: "Already sent",
      provider: "smtp",
    });

    const response = await request(app)
      .post(`/api/notifications/retry/${sentNotif._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should increment retryCount on retry failure", async () => {
    jest.spyOn(emailService, "send").mockRejectedValue(new Error("SMTP still down"));

    const response = await request(app)
      .post(`/api/notifications/retry/${failedNotification._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(500);

    const dbNotif = await Notification.findById(failedNotification._id);
    expect(dbNotif.retryCount).toBe(1);
    expect(dbNotif.lastError).toContain("SMTP still down");
  });

  it("should return 404 for non-existent notification ID", async () => {
    const fakeId = "6a68fcf18bf10ee251c42fff";
    const response = await request(app)
      .post(`/api/notifications/retry/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});
