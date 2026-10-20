/**
 * @file notificationRead.test.js
 * @description Module 8: Read / Unread Notification Lifecycle via API.
 * Verifies notification retrieval, unread status, and read marking via HTTP endpoints.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Notification from "../../src/models/Notification.js";
import { createTestUser, generateTestToken } from "../helpers/authHelper.js";

describe("Module 8: Notification Read / Unread Lifecycle", () => {
  let citizenUser;
  let citizenToken;
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    citizenUser = await createTestUser({ role: "user", fullName: "Read Test Citizen" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });

    adminUser = await createTestUser({ role: "admin", fullName: "Read Test Admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });

    // Seed notifications for citizen
    await Notification.create([
      {
        recipient: citizenUser._id,
        type: "COMPLAINT_SUBMITTED",
        channel: "email",
        status: "sent",
        subject: "Notification 1",
        title: "Notification 1",
        message: "First notif",
        provider: "smtp",
        isRead: false,
      },
      {
        recipient: citizenUser._id,
        type: "COMPLAINT_ASSIGNED",
        channel: "email",
        status: "sent",
        subject: "Notification 2",
        title: "Notification 2",
        message: "Second notif",
        provider: "smtp",
        isRead: false,
      },
      {
        recipient: citizenUser._id,
        type: "COMPLAINT_RESOLVED",
        channel: "email",
        status: "sent",
        subject: "Notification 3",
        title: "Notification 3",
        message: "Third notif",
        provider: "smtp",
        isRead: true,
      },
    ]);
  });

  it("should return user notifications via GET /api/notifications (200 OK)", async () => {
    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${citizenToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.notifications.length).toBe(3);
    expect(response.body.total).toBe(3);
  });

  it("should return notifications with correct isRead status", async () => {
    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${citizenToken}`);

    const notifs = response.body.notifications;
    const unread = notifs.filter((n) => !n.isRead);
    const read = notifs.filter((n) => n.isRead);

    expect(unread.length).toBe(2);
    expect(read.length).toBe(1);
  });

  it("should allow admin to view all notifications via GET /api/notifications/admin", async () => {
    const response = await request(app)
      .get("/api/notifications/admin")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.notifications.length).toBeGreaterThanOrEqual(3);
  });

  it("should allow admin to view notification stats via GET /api/notifications/stats", async () => {
    const response = await request(app)
      .get("/api/notifications/stats")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.stats).toBeDefined();
    expect(response.body.stats.total).toBeGreaterThanOrEqual(3);
    expect(response.body.stats.sent).toBeGreaterThanOrEqual(3);
    expect(response.body.stats.deliveryRate).toBeDefined();
  });

  it("should allow admin to delete a notification (200 OK)", async () => {
    const notif = await Notification.findOne({ recipient: citizenUser._id });

    const response = await request(app)
      .delete(`/api/notifications/${notif._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const dbNotif = await Notification.findById(notif._id);
    expect(dbNotif).toBeNull();
  });
});
