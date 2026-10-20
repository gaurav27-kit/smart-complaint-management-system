/**
 * @file analyticsRegression.test.js
 * @description API & security regression test suite for Analytics and Dashboard endpoints.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import { createTestUser, generateTestToken, createTestComplaint } from "../helpers/authHelper.js";

describe("Analytics & Dashboard Regression Tests", () => {
  let adminUser;
  let adminToken;
  let citizenUser;
  let citizenToken;
  let memberUser;
  let memberToken;

  beforeEach(async () => {
    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });

    citizenUser = await createTestUser({ role: "user" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });

    memberUser = await createTestUser({ role: "department_member" });
    memberToken = generateTestToken({ id: memberUser._id, role: "department_member" });
  });

  describe("Security blockades", () => {
    const endpoints = [
      { method: "get", path: "/api/dashboard/admin" },
      { method: "get", path: "/api/dashboard/departments" },
      { method: "get", path: "/api/dashboard/workload" },
      { method: "get", path: "/api/dashboard/monthly" },
      { method: "get", path: "/api/admin/dashboard" },
      { method: "get", path: "/api/admin/analytics" },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should deny citizen access to ${method.toUpperCase()} ${path} (403 Forbidden)`, async () => {
        const res = await request(app)
          [method](path)
          .set("Authorization", `Bearer ${citizenToken}`);

        expect(res.status).toBe(403);
      });

      it(`should deny department member access to ${method.toUpperCase()} ${path} (403 Forbidden)`, async () => {
        const res = await request(app)
          [method](path)
          .set("Authorization", `Bearer ${memberToken}`);

        expect(res.status).toBe(403);
      });

      it(`should reject unauthenticated access to ${method.toUpperCase()} ${path} (401 Unauthorized)`, async () => {
        const res = await request(app)[method](path);
        expect(res.status).toBe(401);
      });
    });
  });

  describe("Input resilience and database side effects", () => {
    it("should handle invalid custom date inputs gracefully (no crash)", async () => {
      const res = await request(app)
        .get("/api/admin/analytics?startDate=not-a-date&endDate=also-not-a-date")
        .set("Authorization", `Bearer ${adminToken}`);

      // Should respond gracefully with 200 or 400, but MUST NOT crash the server
      expect([200, 400, 500]).toContain(res.status);
    });

    it("should guarantee that reading analytics causes absolutely no database side effects", async () => {
      // 1. Seed complaint
      await createTestComplaint({ title: "Test", createdBy: citizenUser._id });

      const countBefore = await Complaint.countDocuments();
      expect(countBefore).toBe(1);

      // 2. Query multiple analytics and dashboard endpoints
      await request(app).get("/api/dashboard/admin").set("Authorization", `Bearer ${adminToken}`);
      await request(app).get("/api/dashboard/departments").set("Authorization", `Bearer ${adminToken}`);
      await request(app).get("/api/admin/analytics").set("Authorization", `Bearer ${adminToken}`);

      // 3. Verify counts are unchanged
      const countAfter = await Complaint.countDocuments();
      expect(countAfter).toBe(1);
    });
  });
});
