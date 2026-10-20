/**
 * @file departmentMember.test.js
 * @description API Test suite for Module 2: Department Member Management.
 * Verifies creation of HEAD and Field Officer roles, member assignment, soft-delete, reactivation, and One-HEAD constraint.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import User from "../../src/models/User.js";
import {
  createTestUser,
  generateTestToken,
  createTestDepartment,
  createTestDepartmentMember,
} from "../helpers/authHelper.js";

describe("Module 2: Department Member Management", () => {
  let adminToken;
  let roadDept;

  beforeEach(async () => {
    const adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });
    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });
  });

  describe("Member Creation & Role Allocation", () => {
    it("should allow Admin to create a Department HEAD (201 Created)", async () => {
      const response = await request(app)
        .post(`/api/departments/${roadDept._id}/members`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "John Head Officer",
          email: "john.head@example.com",
          password: "password123",
          deptRole: "HEAD",
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
      const member = response.body.member;
      expect(member.deptRole).toBe("HEAD");
      expect(member.department.name).toBe("Road Department");

      // DB Check
      const dbMember = await DepartmentMember.findById(member._id);
      expect(dbMember.deptRole).toBe("HEAD");
      expect(dbMember.isActive).toBe(true);
    });

    it("should allow Admin to create multiple Field Officers in the same department (201 Created)", async () => {
      const res1 = await request(app)
        .post(`/api/departments/${roadDept._id}/members`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "Field Officer 1",
          email: "officer1@example.com",
          password: "password123",
          deptRole: "FIELD_OFFICER",
        });

      const res2 = await request(app)
        .post(`/api/departments/${roadDept._id}/members`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "Field Officer 2",
          email: "officer2@example.com",
          password: "password123",
          deptRole: "FIELD_OFFICER",
        });

      expect([200, 201]).toContain(res1.status);
      expect([200, 201]).toContain(res2.status);

      const officers = await DepartmentMember.find({ department: roadDept._id, deptRole: "FIELD_OFFICER" });
      expect(officers.length).toBe(2);
    });
  });

  describe("One HEAD Constraint Enforcement", () => {
    it("should reject creation of a second active HEAD in the same department (409 Conflict)", async () => {
      // 1. Create First HEAD
      await request(app)
        .post(`/api/departments/${roadDept._id}/members`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "First Head",
          email: "head1@example.com",
          password: "password123",
          deptRole: "HEAD",
        });

      // 2. Attempt Second HEAD in same department
      const response = await request(app)
        .post(`/api/departments/${roadDept._id}/members`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          fullName: "Second Head",
          email: "head2@example.com",
          password: "password123",
          deptRole: "HEAD",
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already has an active HEAD");
    });
  });

  describe("Member Deactivation & Reactivation Lifecycle", () => {
    it("should allow Admin to soft-delete / deactivate a member (200 OK)", async () => {
      const user = await createTestUser({ role: "department_member" });
      const member = await createTestDepartmentMember({ user, department: roadDept });

      const response = await request(app)
        .delete(`/api/departments/members/${member._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const dbMember = await DepartmentMember.findById(member._id);
      expect(dbMember.isActive).toBe(false);

      const dbUser = await User.findById(user._id);
      expect(dbUser.isActive).toBe(false);
    });

    it("should allow Admin to reactivate a soft-deleted member (200 OK)", async () => {
      const user = await createTestUser({ role: "department_member", isActive: false });
      const member = await createTestDepartmentMember({ user, department: roadDept, isActive: false });

      const response = await request(app)
        .patch(`/api/departments/members/${member._id}/reactivate`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const dbMember = await DepartmentMember.findById(member._id);
      expect(dbMember.isActive).toBe(true);

      const dbUser = await User.findById(user._id);
      expect(dbUser.isActive).toBe(true);
    });
  });
});
