/**
 * @file departmentActivation.test.js
 * @description API Test suite for Module 4: Activation / Deactivation Scoping.
 * Verifies that inactive department members are excluded from assignments, officer dropdowns, and workload calculations.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import Complaint from "../../src/models/Complaint.js";
import {
  createTestUser,
  generateTestToken,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint,
} from "../helpers/authHelper.js";

describe("Module 4: Activation / Deactivation Scoping", () => {
  let adminToken;
  let roadHeadToken;
  let roadHeadUser;
  let roadDept;
  let activeOfficerUser;
  let activeOfficerMember;
  let inactiveOfficerUser;
  let inactiveOfficerMember;
  let roadComplaint;

  beforeEach(async () => {
    const adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });

    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });

    // 1. Department HEAD
    roadHeadUser = await createTestUser({ role: "department_member" });
    await createTestDepartmentMember({ user: roadHeadUser, department: roadDept, deptRole: "HEAD" });
    roadHeadToken = generateTestToken({ id: roadHeadUser._id, role: "department_member" });

    // 2. Active Field Officer
    activeOfficerUser = await createTestUser({ role: "department_member" });
    activeOfficerMember = await createTestDepartmentMember({
      user: activeOfficerUser,
      department: roadDept,
      deptRole: "FIELD_OFFICER",
      isActive: true,
    });

    // 3. Inactive Field Officer
    inactiveOfficerUser = await createTestUser({ role: "department_member", isActive: false });
    inactiveOfficerMember = await createTestDepartmentMember({
      user: inactiveOfficerUser,
      department: roadDept,
      deptRole: "FIELD_OFFICER",
      isActive: false,
    });

    // 4. Complaint
    roadComplaint = await createTestComplaint({
      title: "Broken Road Divider",
      category: "Road",
      department: roadDept._id,
      status: "Pending",
    });
  });

  it("should exclude inactive officer from GET /api/member/officers dropdown", async () => {
    const response = await request(app)
      .get("/api/member/officers")
      .set("Authorization", `Bearer ${roadHeadToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    const officers = response.body.officers || response.body.data;
    const officerIds = officers.map(o => o._id.toString());

    expect(officerIds).toContain(activeOfficerMember._id.toString());
    expect(officerIds).not.toContain(inactiveOfficerMember._id.toString());
  });

  it("should reject assigning a complaint to an inactive officer (400 Bad Request)", async () => {
    const response = await request(app)
      .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
      .set("Authorization", `Bearer ${roadHeadToken}`)
      .send({ memberId: inactiveOfficerMember._id });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    // Verify DB State Integrity: Complaint assignedMember remains null/unassigned
    const dbComplaint = await Complaint.findById(roadComplaint._id);
    expect(dbComplaint.assignedMember).toBeFalsy();
  });

  it("should restore officer visibility and assignment capability upon reactivation", async () => {
    // Reactivate officer
    await request(app)
      .patch(`/api/departments/members/${inactiveOfficerMember._id}/reactivate`)
      .set("Authorization", `Bearer ${adminToken}`);

    // Verify Officer appears in dropdown
    const dropdownRes = await request(app)
      .get("/api/member/officers")
      .set("Authorization", `Bearer ${roadHeadToken}`);

    const officers = dropdownRes.body.officers || dropdownRes.body.data;
    const officerIds = officers.map(o => o._id.toString());
    expect(officerIds).toContain(inactiveOfficerMember._id.toString());

    // Verify Assignment now succeeds
    const assignRes = await request(app)
      .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
      .set("Authorization", `Bearer ${roadHeadToken}`)
      .send({ memberId: inactiveOfficerMember._id });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.success).toBe(true);
  });
});
