/**
 * @file fieldOfficerPermissions.test.js
 * @description API Test suite for Module 4: Field Officer Role Permissions & Boundaries.
 * Validates officer scoping to assigned complaints and verifies restriction against assignment, admin, or cross-officer operations.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import Complaint from "../../src/models/Complaint.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import {
  createTestUser,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint,
  generateTestToken,
} from "../helpers/authHelper.js";

describe("Module 4: Field Officer Role Permissions & Boundaries", () => {
  let roadDept;
  let officerUser;
  let officerMember;
  let officerToken;
  let otherOfficerUser;
  let otherOfficerMember;
  let assignedComplaint;
  let unassignedComplaint;

  beforeEach(async () => {
    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });

    // 1. Officer 1
    officerUser = await createTestUser({ role: "department_member" });
    officerMember = await createTestDepartmentMember({
      user: officerUser,
      department: roadDept,
      deptRole: "FIELD_OFFICER",
    });
    officerToken = generateTestToken({ id: officerUser._id, role: "department_member" });

    // 2. Officer 2
    otherOfficerUser = await createTestUser({ role: "department_member" });
    otherOfficerMember = await createTestDepartmentMember({
      user: otherOfficerUser,
      department: roadDept,
      deptRole: "FIELD_OFFICER",
    });

    // 3. Assigned Complaint
    assignedComplaint = await createTestComplaint({
      title: "Fix Pothole on 10th St",
      department: roadDept._id,
      assignedMember: officerMember._id,
      status: "In Progress",
    });

    // 4. Unassigned / Other Officer Complaint
    unassignedComplaint = await createTestComplaint({
      title: "Fix Streetlight on 12th St",
      department: roadDept._id,
      assignedMember: otherOfficerMember._id,
      status: "Pending",
    });
  });

  describe("Allowed Field Officer Operations", () => {
    it("should allow Field Officer to view complaints assigned to them (200 OK)", async () => {
      const response = await request(app)
        .get("/api/member/complaints")
        .set("Authorization", `Bearer ${officerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const complaints = response.body.complaints || response.body.data;
      const complaintIds = complaints.map(c => c._id.toString());
      expect(complaintIds).toContain(assignedComplaint._id.toString());
      expect(complaintIds).not.toContain(unassignedComplaint._id.toString());
    });

    it("should allow Field Officer to update status of assigned complaint (200 OK)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${assignedComplaint._id}/status`)
        .set("Authorization", `Bearer ${officerToken}`)
        .send({ status: "Resolved" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const dbComplaint = await Complaint.findById(assignedComplaint._id);
      expect(dbComplaint.status).toBe("Resolved");
    });

    it("should allow Field Officer to add internal resolution note (201 Created)", async () => {
      const response = await request(app)
        .post(`/api/member/complaints/${assignedComplaint._id}/notes`)
        .set("Authorization", `Bearer ${officerToken}`)
        .send({ note: "Road patch applied successfully." });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);

      const dbComplaint = await Complaint.findById(assignedComplaint._id);
      expect(dbComplaint.notes.length).toBeGreaterThan(0);
      expect(dbComplaint.notes[0].text).toContain("Road patch applied");
    });

    it("should allow Field Officer to view workload metrics (200 OK)", async () => {
      const response = await request(app)
        .get("/api/member/workload")
        .set("Authorization", `Bearer ${officerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("Forbidden Field Officer Operations & Integrity Verification", () => {
    it("should reject Field Officer attempt to assign or reassign complaints (403 Forbidden)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${assignedComplaint._id}/assign`)
        .set("Authorization", `Bearer ${officerToken}`)
        .send({ memberId: otherOfficerMember._id });

      expect([400, 403]).toContain(response.status);

      // Verify DB State Integrity: Assigned member remains officerMember
      const dbComplaint = await Complaint.findById(assignedComplaint._id);
      expect(dbComplaint.assignedMember.toString()).toBe(officerMember._id.toString());
    });

    it("should reject Field Officer attempt to access Admin Portal (403 Forbidden)", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${officerToken}`);

      expect(response.status).toBe(403);
    });

    it("should reject Field Officer attempt to update status of complaint assigned to another officer (403/404)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${unassignedComplaint._id}/status`)
        .set("Authorization", `Bearer ${officerToken}`)
        .send({ status: "Resolved" });

      expect([403, 404]).toContain(response.status);

      // DB Integrity check
      const dbComplaint = await Complaint.findById(unassignedComplaint._id);
      expect(dbComplaint.status).toBe("Pending");
    });

    it("should reject Field Officer attempt to add note to complaint assigned to another officer (403/404)", async () => {
      const response = await request(app)
        .post(`/api/member/complaints/${unassignedComplaint._id}/notes`)
        .set("Authorization", `Bearer ${officerToken}`)
        .send({ note: "Unauthorized note attempt" });

      expect([403, 404]).toContain(response.status);

      const dbComplaint = await Complaint.findById(unassignedComplaint._id);
      expect(dbComplaint.notes.length).toBe(0);
    });
  });
});
