/**
 * @file memberAssignment.test.js
 * @description API Test suite for Module 4: Department HEAD Member Assignment.
 */

import request from "supertest";
import { jest } from "@jest/globals";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import {
  createTestUser,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint,
  generateTestToken,
} from "../helpers/authHelper.js";
import { notificationService } from "../../src/notifications/services/NotificationService.js";

describe("PATCH /api/member/complaints/:id/assign (Department HEAD Assignment)", () => {
  let roadDept;
  let waterDept;
  let headUser;
  let headMember;
  let headToken;
  let otherHeadUser;
  let otherHeadToken;
  let fieldOfficerUser;
  let fieldOfficerMember;
  let inactiveOfficerMember;
  let waterOfficerMember;
  let complaint;

  beforeEach(async () => {
    jest.spyOn(notificationService, "dispatch").mockImplementation(() => Promise.resolve());

    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });
    waterDept = await createTestDepartment({ name: "Water Department", code: "WATER" });

    // Road Dept HEAD
    headUser = await createTestUser({ role: "department_member" });
    headMember = await createTestDepartmentMember({
      user: headUser,
      department: roadDept,
      deptRole: "HEAD",
    });
    headToken = generateTestToken({ id: headUser._id, role: "department_member" });

    // Water Dept HEAD
    otherHeadUser = await createTestUser({ role: "department_member" });
    await createTestDepartmentMember({
      user: otherHeadUser,
      department: waterDept,
      deptRole: "HEAD",
    });
    otherHeadToken = generateTestToken({ id: otherHeadUser._id, role: "department_member" });

    // Field Officer in Road Dept
    fieldOfficerUser = await createTestUser({ role: "department_member" });
    fieldOfficerMember = await createTestDepartmentMember({
      user: fieldOfficerUser,
      department: roadDept,
      deptRole: "FIELD_OFFICER",
      isActive: true,
    });

    // Inactive Field Officer in Road Dept
    const inactiveUser = await createTestUser({ role: "department_member" });
    inactiveOfficerMember = await createTestDepartmentMember({
      user: inactiveUser,
      department: roadDept,
      deptRole: "FIELD_OFFICER",
      isActive: false,
    });

    // Field Officer in Water Dept
    const waterUser = await createTestUser({ role: "department_member" });
    waterOfficerMember = await createTestDepartmentMember({
      user: waterUser,
      department: waterDept,
      deptRole: "FIELD_OFFICER",
    });

    // Complaint in Road Dept
    complaint = await createTestComplaint({ department: roadDept._id });
  });

  it("should allow Department HEAD to assign a Field Officer in their department (200 OK)", async () => {
    const response = await request(app)
      .patch(`/api/member/complaints/${complaint._id}/assign`)
      .set("Authorization", `Bearer ${headToken}`)
      .send({ memberId: fieldOfficerMember._id });

    // 1. Verify HTTP Status & Response Body
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // 2. Verify Database Persistence
    const updatedDb = await Complaint.findById(complaint._id);
    expect(updatedDb.assignedMember.toString()).toBe(fieldOfficerMember._id.toString());

    // 3. Verify Timeline Entry Creation
    const timelineEntry = updatedDb.timeline.find(t => t.type === "MEMBER_ASSIGNED" || t.type === "COMPLAINT_ASSIGNED");
    expect(timelineEntry).toBeDefined();
  });

  it("should reject assignment to an officer from another department (400 Bad Request)", async () => {
    const response = await request(app)
      .patch(`/api/member/complaints/${complaint._id}/assign`)
      .set("Authorization", `Bearer ${headToken}`)
      .send({ memberId: waterOfficerMember._id });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should reject assignment to an inactive officer (400 Bad Request)", async () => {
    const response = await request(app)
      .patch(`/api/member/complaints/${complaint._id}/assign`)
      .set("Authorization", `Bearer ${headToken}`)
      .send({ memberId: inactiveOfficerMember._id });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should reject assignment attempt by HEAD of another department (403 Forbidden or 404 Not Found)", async () => {
    const response = await request(app)
      .patch(`/api/member/complaints/${complaint._id}/assign`)
      .set("Authorization", `Bearer ${otherHeadToken}`)
      .send({ memberId: fieldOfficerMember._id });

    expect([403, 404]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });
});
