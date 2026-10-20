/**
 * @file adminDashboard.test.js
 * @description API Test suite for Admin Dashboard endpoints (/api/dashboard/admin and /api/admin/dashboard).
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import User from "../../src/models/User.js";
import { createTestUser, generateTestToken, createTestComplaint } from "../helpers/authHelper.js";

describe("Admin Dashboard APIs", () => {
  let adminUser;
  let adminToken;
  let citizenUser;
  let citizenToken;

  beforeEach(async () => {
    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });

    citizenUser = await createTestUser({ role: "user" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });
  });

  describe("GET /api/dashboard/admin", () => {
    it("should return empty metrics when no complaints exist (200 OK)", async () => {
      const res = await request(app)
        .get("/api/dashboard/admin")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.totalComplaints).toBe(0);
      expect(res.body.data.pending).toBe(0);
      expect(res.body.data.inProgress).toBe(0);
      expect(res.body.data.resolved).toBe(0);
      expect(res.body.data.closed).toBe(0);
    });

    it("should compute correct complaint metrics for populated DB (200 OK)", async () => {
      // Seed complaints with varying statuses and priorities
      await createTestComplaint({ status: "Pending", priority: "High", createdBy: citizenUser._id });
      await createTestComplaint({ status: "In Progress", priority: "Medium", createdBy: citizenUser._id });
      await createTestComplaint({ status: "Resolved", priority: "Low", createdBy: citizenUser._id });
      await createTestComplaint({ status: "Closed", priority: "High", createdBy: citizenUser._id });
      await createTestComplaint({ status: "Pending", priority: "Medium", createdBy: citizenUser._id });

      const res = await request(app)
        .get("/api/dashboard/admin")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalComplaints).toBe(5);
      expect(res.body.data.pending).toBe(2);
      expect(res.body.data.inProgress).toBe(1);
      expect(res.body.data.resolved).toBe(1);
      expect(res.body.data.closed).toBe(1);
      expect(res.body.data.highPriority).toBe(2);
      expect(res.body.data.mediumPriority).toBe(2);
      expect(res.body.data.lowPriority).toBe(1);
    });

    it("should reject access for non-admin users (403 Forbidden)", async () => {
      const res = await request(app)
        .get("/api/dashboard/admin")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should reject access for unauthenticated requests (401 Unauthorized)", async () => {
      const res = await request(app).get("/api/dashboard/admin");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/admin/dashboard", () => {
    it("should retrieve correct dashboard stats including user counts (200 OK)", async () => {
      // 2 users already created in beforeEach (adminUser, citizenUser)
      // Create another citizen user
      await createTestUser({ role: "user" });

      // Seed complaints
      await createTestComplaint({ status: "Pending", priority: "High", createdBy: citizenUser._id });
      await createTestComplaint({ status: "Resolved", priority: "Medium", createdBy: citizenUser._id });

      const res = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.dashboard).toBeDefined();
      expect(res.body.dashboard.totalUsers).toBe(3);
      expect(res.body.dashboard.totalComplaints).toBe(2);
      expect(res.body.dashboard.pending).toBe(1);
      expect(res.body.dashboard.resolved).toBe(1);
      expect(res.body.dashboard.highPriority).toBe(1);
      expect(res.body.dashboard.mediumPriority).toBe(1);
    });

    it("should enforce authorization rules (403 Forbidden)", async () => {
      const res = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
    });
  });
});
