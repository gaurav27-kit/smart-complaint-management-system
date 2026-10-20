/**
 * @file notificationIsolation.test.js
 * @description Module 9: Notification Isolation per Role.
 * Verifies that each user can only see their own notifications via the API.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Notification from "../../src/models/Notification.js";
import { createTestUser, generateTestToken } from "../helpers/authHelper.js";

describe("Module 9: Notification Isolation per Role", () => {
  let citizenA;
  let citizenB;
  let officer;
  let admin;
  let citizenAToken;
  let citizenBToken;
  let officerToken;
  let adminToken;

  beforeEach(async () => {
    citizenA = await createTestUser({ role: "user", fullName: "Citizen A" });
    citizenB = await createTestUser({ role: "user", fullName: "Citizen B" });
    officer = await createTestUser({ role: "department_member", fullName: "Officer X" });
    admin = await createTestUser({ role: "admin", fullName: "Admin Z" });

    citizenAToken = generateTestToken({ id: citizenA._id, role: "user" });
    citizenBToken = generateTestToken({ id: citizenB._id, role: "user" });
    officerToken = generateTestToken({ id: officer._id, role: "department_member" });
    adminToken = generateTestToken({ id: admin._id, role: "admin" });

    // Seed notifications for each user
    await Notification.create([
      {
        recipient: citizenA._id,
        type: "COMPLAINT_SUBMITTED",
        channel: "email",
        status: "sent",
        subject: "Citizen A Notification",
        title: "Citizen A Notif",
        message: "For Citizen A",
        provider: "smtp",
      },
      {
        recipient: citizenB._id,
        type: "COMPLAINT_ASSIGNED",
        channel: "email",
        status: "sent",
        subject: "Citizen B Notification",
        title: "Citizen B Notif",
        message: "For Citizen B",
        provider: "smtp",
      },
      {
        recipient: officer._id,
        type: "MEMBER_COMPLAINT_ASSIGNED",
        channel: "email",
        status: "sent",
        subject: "Officer Notification",
        title: "Officer Notif",
        message: "For Officer",
        provider: "smtp",
      },
      {
        recipient: admin._id,
        type: "DAILY_SUMMARY",
        channel: "email",
        status: "sent",
        subject: "Admin Summary",
        title: "Admin Notif",
        message: "For Admin",
        provider: "smtp",
      },
    ]);
  });

  it("should only return Citizen A's own notifications", async () => {
    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${citizenAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].subject).toBe("Citizen A Notification");
  });

  it("should only return Citizen B's own notifications", async () => {
    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${citizenBToken}`);

    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].subject).toBe("Citizen B Notification");
  });

  it("should only return Officer's own notifications via user endpoint", async () => {
    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${officerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].subject).toBe("Officer Notification");
  });

  it("should return Admin's own notifications via user endpoint", async () => {
    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(1);
    expect(response.body.notifications[0].subject).toBe("Admin Summary");
  });

  it("should allow Admin to see ALL notifications via admin endpoint", async () => {
    const response = await request(app)
      .get("/api/notifications/admin")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBe(4);
  });
});
