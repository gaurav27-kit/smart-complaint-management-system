/**
 * @file visibility.test.js
 * @description API Test suite for Module 10: Visibility & Role-Based Access Control (RBAC).
 */

import request from "supertest";
import { jest } from "@jest/globals";
import app from "../helpers/testApp.js";
import {
  createTestUser,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint,
  generateTestToken,
} from "../helpers/authHelper.js";
import { notificationService } from "../../src/notifications/services/NotificationService.js";

describe("Module 10: Visibility & Role-Based Access Control (RBAC)", () => {
  let citizen1, citizen1Token;
  let citizen2, citizen2Token;
  let adminUser, adminToken;
  let roadDept, waterDept;
  let roadHeadUser, roadHeadToken;
  let roadOfficerUser, roadOfficerMember, roadOfficerToken;
  let otherOfficerUser, otherOfficerMember, otherOfficerToken;
  let complaint1, complaint2;

  beforeEach(async () => {
    jest.spyOn(notificationService, "dispatch").mockImplementation(() => Promise.resolve());

    // 1. Setup Users
    citizen1 = await createTestUser({ role: "user" });
    citizen1Token = generateTestToken({ id: citizen1._id, role: "user" });

    citizen2 = await createTestUser({ role: "user" });
    citizen2Token = generateTestToken({ id: citizen2._id, role: "user" });

    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });

    // 2. Setup Departments
    roadDept = await createTestDepartment({ name: "Road Dept", code: "ROAD" });
    waterDept = await createTestDepartment({ name: "Water Dept", code: "WATER" });

    // 3. Setup Members
    roadHeadUser = await createTestUser({ role: "department_member" });
    await createTestDepartmentMember({ user: roadHeadUser, department: roadDept, deptRole: "HEAD" });
    roadHeadToken = generateTestToken({ id: roadHeadUser._id, role: "department_member" });

    roadOfficerUser = await createTestUser({ role: "department_member" });
    roadOfficerMember = await createTestDepartmentMember({ user: roadOfficerUser, department: roadDept, deptRole: "FIELD_OFFICER" });
    roadOfficerToken = generateTestToken({ id: roadOfficerUser._id, role: "department_member" });

    otherOfficerUser = await createTestUser({ role: "department_member" });
    otherOfficerMember = await createTestDepartmentMember({ user: otherOfficerUser, department: roadDept, deptRole: "FIELD_OFFICER" });
    otherOfficerToken = generateTestToken({ id: otherOfficerUser._id, role: "department_member" });

    // 4. Setup Complaints
    complaint1 = await createTestComplaint({ createdBy: citizen1._id, department: roadDept._id, assignedMember: roadOfficerMember._id });
    complaint2 = await createTestComplaint({ createdBy: citizen2._id, department: waterDept._id });
  });

  it("Citizen should view ONLY their own complaints", async () => {
    const response = await request(app)
      .get("/api/complaints")
      .set("Authorization", `Bearer ${citizen1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const complaintsList = response.body.complaints || response.body.data || [];
    const complaintIds = complaintsList.map(c => c._id.toString());
    expect(complaintIds).toContain(complaint1._id.toString());
    expect(complaintIds).not.toContain(complaint2._id.toString());
  });

  it("Citizen cannot view complaints belonging to other citizens via direct GET ID (403 Forbidden or 404 Not Found)", async () => {
    const response = await request(app)
      .get(`/api/complaints/${complaint2._id}`)
      .set("Authorization", `Bearer ${citizen1Token}`);

    expect([403, 404]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it("Field Officer should view ONLY complaints assigned to them", async () => {
    const response = await request(app)
      .get("/api/member/complaints")
      .set("Authorization", `Bearer ${roadOfficerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const complaintsList = response.body.complaints || response.body.data || [];
    const complaintIds = complaintsList.map(c => c._id.toString());
    expect(complaintIds).toContain(complaint1._id.toString());
    expect(complaintIds).not.toContain(complaint2._id.toString());
  });

  it("Field Officer cannot view complaints assigned to other officers", async () => {
    const response = await request(app)
      .get("/api/member/complaints")
      .set("Authorization", `Bearer ${otherOfficerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const complaintsList = response.body.complaints || response.body.data || [];
    const complaintIds = complaintsList.map(c => c._id.toString());
    expect(complaintIds).not.toContain(complaint1._id.toString());
  });

  it("Department HEAD should view complaints belonging to their department", async () => {
    const response = await request(app)
      .get("/api/member/complaints")
      .set("Authorization", `Bearer ${roadHeadToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const complaintsList = response.body.complaints || response.body.data || [];
    const complaintIds = complaintsList.map(c => c._id.toString());
    expect(complaintIds).toContain(complaint1._id.toString());
    expect(complaintIds).not.toContain(complaint2._id.toString());
  });
});
