/**
 * @file departmentAssignmentRules.test.js
 * @description API & Database Integrity Test suite for Module 5 & Module 12: Assignment Rules & Relational Integrity.
 * Verifies role-based assignment parameters, cross-department rejection, reassignment timeline events, and relational integrity.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import {
  createTestUser,
  generateTestToken,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint,
} from "../helpers/authHelper.js";

describe("Module 5 & Module 12: Assignment Rules & Relational Integrity", () => {
  let adminToken;
  let roadHeadToken;
  let officerToken;
  let citizenToken;
  let roadDept;
  let waterDept;
  let roadHeadUser;
  let roadOfficerMember;
  let waterOfficerMember;
  let roadComplaint;

  beforeEach(async () => {
    adminToken = generateTestToken({ id: (await createTestUser({ role: "admin" }))._id, role: "admin" });
    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });
    waterDept = await createTestDepartment({ name: "Water Department", code: "WATER" });

    // 1. Road HEAD
    roadHeadUser = await createTestUser({ role: "department_member" });
    await createTestDepartmentMember({ user: roadHeadUser, department: roadDept, deptRole: "HEAD" });
    roadHeadToken = generateTestToken({ id: roadHeadUser._id, role: "department_member" });

    // 2. Field Officer 1 (Road)
    const officer1User = await createTestUser({ role: "department_member" });
    roadOfficerMember = await createTestDepartmentMember({
      user: officer1User,
      department: roadDept,
      deptRole: "FIELD_OFFICER",
    });
    officerToken = generateTestToken({ id: officer1User._id, role: "department_member" });

    // 3. Field Officer 2 (Water)
    const waterOfficerUser = await createTestUser({ role: "department_member" });
    waterOfficerMember = await createTestDepartmentMember({
      user: waterOfficerUser,
      department: waterDept,
      deptRole: "FIELD_OFFICER",
    });

    // 4. Citizen
    const citizenUser = await createTestUser({ role: "user" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });

    // 5. Complaint
    roadComplaint = await createTestComplaint({
      title: "Broken Signal on Main Rd",
      category: "Road",
      department: roadDept._id,
    });
  });

  describe("Role Assignment Boundaries", () => {
    it("should allow Admin to assign department to complaint (200 OK)", async () => {
      const response = await request(app)
        .patch(`/api/complaints/${roadComplaint._id}/assign-department`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ departmentId: waterDept._id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const dbComplaint = await Complaint.findById(roadComplaint._id);
      expect(dbComplaint.department.toString()).toBe(waterDept._id.toString());
    });

    it("should allow Department HEAD to assign a Field Officer (200 OK)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
        .set("Authorization", `Bearer ${roadHeadToken}`)
        .send({ memberId: roadOfficerMember._id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const dbComplaint = await Complaint.findById(roadComplaint._id);
      expect(dbComplaint.assignedMember.toString()).toBe(roadOfficerMember._id.toString());
    });

    it("should reject officer assignment attempt by Admin via member route (403 Forbidden)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ memberId: roadOfficerMember._id });

      expect(response.status).toBe(403);
    });

    it("should reject officer assignment attempt by Field Officer (403 Forbidden)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
        .set("Authorization", `Bearer ${officerToken}`)
        .send({ memberId: roadOfficerMember._id });

      expect(response.status).toBe(403);
    });

    it("should reject officer assignment attempt by Citizen (403 Forbidden)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ memberId: roadOfficerMember._id });

      expect(response.status).toBe(403);
    });
  });

  describe("Relational & Cross-Department Integrity", () => {
    it("should reject HEAD attempt to assign officer from another department (400 Bad Request)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
        .set("Authorization", `Bearer ${roadHeadToken}`)
        .send({ memberId: waterOfficerMember._id });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Field officer not found in your department");

      // Verify DB State Integrity: No cross-department assignment
      const dbComplaint = await Complaint.findById(roadComplaint._id);
      expect(dbComplaint.assignedMember).toBeFalsy();
    });

    it("should enforce matching department relationship after assignment", async () => {
      await request(app)
        .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
        .set("Authorization", `Bearer ${roadHeadToken}`)
        .send({ memberId: roadOfficerMember._id });

      const dbComplaint = await Complaint.findById(roadComplaint._id);
      const dbMember = await DepartmentMember.findById(dbComplaint.assignedMember);

      expect(dbComplaint.department.toString()).toBe(dbMember.department.toString());
    });
  });
});
