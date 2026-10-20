/**
 * @file inAppNotification.test.js
 * @description Supplemental: Admin Notification API Coverage.
 * Tests admin-only notification endpoints including filtering and manual job triggers.
 */

import { jest } from "@jest/globals";
import request from "supertest";
import app from "../helpers/testApp.js";
import { emailService } from "../../src/notifications/services/EmailService.js";
import Notification from "../../src/models/Notification.js";
import { createTestUser, generateTestToken } from "../helpers/authHelper.js";

jest.spyOn(emailService, "send").mockResolvedValue({
  messageId: "mock-admin-api-msg",
  provider: "smtp",
});

describe("Supplemental: Admin Notification API Coverage", () => {
  let adminUser;
  let adminToken;
  let citizenToken;

  beforeEach(async () => {
    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });

    const citizenUser = await createTestUser({ role: "user" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });

    // Seed various notification types
    await Notification.create([
      {
        recipient: adminUser._id,
        type: "DAILY_SUMMARY",
        channel: "email",
        status: "sent",
        subject: "Daily Summary",
        title: "Daily",
        message: "Test",
        provider: "smtp",
      },
      {
        recipient: adminUser._id,
        type: "COMPLAINT_SUBMITTED",
        channel: "email",
        status: "failed",
        subject: "Failed Notif",
        title: "Failed",
        message: "Test",
        provider: "smtp",
        lastError: "Connection refused",
      },
      {
        recipient: adminUser._id,
        type: "WEEKLY_ANALYTICS",
        channel: "email",
        status: "pending",
        subject: "Pending Analytics",
        title: "Pending",
        message: "Test",
        provider: "smtp",
      },
    ]);
  });

  it("should filter admin notifications by status (200 OK)", async () => {
    const response = await request(app)
      .get("/api/notifications/admin?status=failed")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    response.body.notifications.forEach((n) => {
      expect(n.status).toBe("failed");
    });
  });

  it("should filter admin notifications by type (200 OK)", async () => {
    const response = await request(app)
      .get("/api/notifications/admin?type=DAILY_SUMMARY")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    response.body.notifications.forEach((n) => {
      expect(n.type).toBe("DAILY_SUMMARY");
    });
  });

  it("should reject non-admin access to admin notification endpoints (403 Forbidden)", async () => {
    const adminRes = await request(app)
      .get("/api/notifications/admin")
      .set("Authorization", `Bearer ${citizenToken}`);

    expect(adminRes.status).toBe(403);

    const statsRes = await request(app)
      .get("/api/notifications/stats")
      .set("Authorization", `Bearer ${citizenToken}`);

    expect(statsRes.status).toBe(403);
  });

  it("should trigger daily summary job via API (202 Accepted)", async () => {
    const response = await request(app)
      .post("/api/notifications/send-daily-summary")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(202);
    expect(response.body.success).toBe(true);
  });

  it("should trigger weekly analytics job via API (202 Accepted)", async () => {
    const response = await request(app)
      .post("/api/notifications/send-weekly-analytics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(202);
    expect(response.body.success).toBe(true);
  });
});
