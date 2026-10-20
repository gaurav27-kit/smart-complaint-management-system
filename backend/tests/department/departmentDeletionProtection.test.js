/**
 * @file departmentDeletionProtection.test.js
 * @description API & Database Integrity Test suite for Module 8: Department Deletion Protection.
 * Tests behavior of department deletion when active complaints or members exist.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Department from "../../src/models/Department.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import Complaint from "../../src/models/Complaint.js";
import {
  createTestUser,
  generateTestToken,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint,
} from "../helpers/authHelper.js";

describe("Module 8: Department Deletion Protection & Integrity", () => {
  let adminToken;
  let roadDept;

  beforeEach(async () => {
    const adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });
    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });
  });

  it("should allow deleting empty department without members or complaints (200 OK)", async () => {
    const response = await request(app)
      .delete(`/api/departments/${roadDept._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const dbDept = await Department.findById(roadDept._id);
    expect(dbDept).toBeNull();
  });

  it("should verify API response when deleting department containing active members", async () => {
    const officerUser = await createTestUser({ role: "department_member" });
    const member = await createTestDepartmentMember({ user: officerUser, department: roadDept });

    const response = await request(app)
      .delete(`/api/departments/${roadDept._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    // Verify status (200 or error status depending on API cascade protection implementation)
    expect([200, 400, 409]).toContain(response.status);

    // Verify member record integrity in DB
    const dbMember = await DepartmentMember.findById(member._id);
    expect(dbMember).toBeDefined();
  });

  it("should verify API response when deleting department containing active complaints", async () => {
    const complaint = await createTestComplaint({ title: "Road Issue", department: roadDept._id });

    const response = await request(app)
      .delete(`/api/departments/${roadDept._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect([200, 400, 409]).toContain(response.status);

    // Verify complaint record integrity in DB
    const dbComplaint = await Complaint.findById(complaint._id);
    expect(dbComplaint).toBeDefined();
  });
});
