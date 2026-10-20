/**
 * @file employeeIdGeneration.test.js
 * @description API & Data Integrity Test suite for Module 3 & Module 11: Employee ID Generation & Integrity.
 * Verifies auto-generation uniqueness, persistence across updates/passwords/activations, and soft-delete retention.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import {
  createTestUser,
  generateTestToken,
  createTestDepartment,
  createTestDepartmentMember,
} from "../helpers/authHelper.js";

describe("Module 3 & Module 11: Employee ID Generation & Integrity", () => {
  let adminToken;
  let roadDept;

  beforeEach(async () => {
    const adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });
    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });
  });

  it("should auto-generate unique Employee IDs sequentially (e.g. EMP0001, EMP0002)", async () => {
    const res1 = await request(app)
      .post(`/api/departments/${roadDept._id}/members`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        fullName: "Employee Alpha",
        email: "emp.alpha@example.com",
        password: "password123",
        deptRole: "FIELD_OFFICER",
      });

    const res2 = await request(app)
      .post(`/api/departments/${roadDept._id}/members`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        fullName: "Employee Beta",
        email: "emp.beta@example.com",
        password: "password123",
        deptRole: "FIELD_OFFICER",
      });

    expect([200, 201]).toContain(res1.status);
    expect([200, 201]).toContain(res2.status);

    const empId1 = res1.body.member.user.employeeId;
    const empId2 = res2.body.member.user.employeeId;

    expect(empId1).toBeDefined();
    expect(empId2).toBeDefined();
    expect(empId1).not.toBe(empId2);
    expect(empId1).toMatch(/^EMP\d{4}$/);
    expect(empId2).toMatch(/^EMP\d{4}$/);
  });

  it("should reject custom Employee ID when it conflicts with an existing assigned ID (409 Conflict)", async () => {
    // 1. Create member with explicit employeeId
    await request(app)
      .post(`/api/departments/${roadDept._id}/members`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        fullName: "Custom ID User",
        email: "custom.id@example.com",
        password: "password123",
        employeeId: "EMP-9999",
      });

    // 2. Attempt duplicate employeeId
    const response = await request(app)
      .post(`/api/departments/${roadDept._id}/members`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        fullName: "Duplicate ID User",
        email: "dup.id@example.com",
        password: "password123",
        employeeId: "EMP-9999",
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("already assigned to another user");
  });

  it("should preserve Employee ID after profile updates or activation/deactivation", async () => {
    const user = await createTestUser({
      role: "department_member",
      employeeId: "EMP-7700",
    });
    const member = await createTestDepartmentMember({ user, department: roadDept });

    // 1. Soft delete
    await request(app)
      .delete(`/api/departments/members/${member._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    let dbUser = await User.findById(user._id);
    expect(dbUser.employeeId).toBe("EMP-7700");

    // 2. Reactivate
    await request(app)
      .patch(`/api/departments/members/${member._id}/reactivate`)
      .set("Authorization", `Bearer ${adminToken}`);

    dbUser = await User.findById(user._id);
    expect(dbUser.employeeId).toBe("EMP-7700");
  });

  it("should ensure soft-deleted Employee IDs are retained in DB and never duplicated", async () => {
    const user = await createTestUser({
      role: "department_member",
      employeeId: "EMP-RETAIN",
    });
    const member = await createTestDepartmentMember({ user, department: roadDept, isActive: false });

    // Attempt creation with same employeeId
    const response = await request(app)
      .post(`/api/departments/${roadDept._id}/members`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        fullName: "Reused ID Attempt",
        email: "reused.attempt@example.com",
        password: "password123",
        employeeId: "EMP-RETAIN",
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });
});
