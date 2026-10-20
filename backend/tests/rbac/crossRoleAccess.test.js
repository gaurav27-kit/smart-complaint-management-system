/**
 * @file crossRoleAccess.test.js
 * @description API Test suite for Module 5: Cross-Role Security Matrix Verification.
 * Enforces role boundary checks across all system routes (Citizen, Department HEAD, Field Officer, Admin).
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import {
  createTestUser,
  createTestDepartment,
  createTestDepartmentMember,
  generateTestToken,
} from "../helpers/authHelper.js";

describe("Module 5: Cross-Role Security Matrix Verification", () => {
  let citizenToken;
  let headToken;
  let officerToken;
  let adminToken;
  let roadDept;

  beforeEach(async () => {
    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });

    // 1. Citizen
    const citizenUser = await createTestUser({ role: "user" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });

    // 2. Department HEAD
    const headUser = await createTestUser({ role: "department_member" });
    await createTestDepartmentMember({ user: headUser, department: roadDept, deptRole: "HEAD" });
    headToken = generateTestToken({ id: headUser._id, role: "department_member" });

    // 3. Field Officer
    const officerUser = await createTestUser({ role: "department_member" });
    await createTestDepartmentMember({ user: officerUser, department: roadDept, deptRole: "FIELD_OFFICER" });
    officerToken = generateTestToken({ id: officerUser._id, role: "department_member" });

    // 4. Admin
    const adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });
  });

  describe("Security Matrix Enforcement", () => {
    it("should reject Citizen JWT from accessing Admin endpoints (403 Forbidden)", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject Citizen JWT from accessing Member HEAD endpoints (400/403/404)", async () => {
      const response = await request(app)
        .get("/api/member/officers")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect([400, 403, 404]).toContain(response.status);
    });

    it("should reject Field Officer JWT from accessing Admin endpoints (403 Forbidden)", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${officerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject Department HEAD JWT from accessing Admin endpoints (403 Forbidden)", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${headToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should allow Admin JWT to access Admin endpoints (200 OK)", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
