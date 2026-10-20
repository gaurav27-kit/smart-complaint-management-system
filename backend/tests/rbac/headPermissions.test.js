/**
 * @file headPermissions.test.js
 * @description API Test suite for Module 3: Department HEAD Role Permissions & Boundaries.
 * Validates management capability within assigned department and strict isolation against cross-department or admin endpoints.
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

describe("Module 3: Department HEAD Role Permissions & Boundaries", () => {
  let roadDept;
  let waterDept;
  let roadHeadUser;
  let roadHeadMember;
  let roadHeadToken;
  let roadOfficerUser;
  let roadOfficerMember;
  let waterOfficerUser;
  let waterOfficerMember;
  let roadComplaint;
  let waterComplaint;

  beforeEach(async () => {
    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });
    waterDept = await createTestDepartment({ name: "Water Department", code: "WATER" });

    // 1. Road HEAD
    roadHeadUser = await createTestUser({ role: "department_member" });
    roadHeadMember = await createTestDepartmentMember({
      user: roadHeadUser,
      department: roadDept,
      deptRole: "HEAD",
    });
    roadHeadToken = generateTestToken({ id: roadHeadUser._id, role: "department_member" });

    // 2. Road Field Officer
    roadOfficerUser = await createTestUser({ role: "department_member" });
    roadOfficerMember = await createTestDepartmentMember({
      user: roadOfficerUser,
      department: roadDept,
      deptRole: "FIELD_OFFICER",
    });

    // 3. Water Field Officer
    waterOfficerUser = await createTestUser({ role: "department_member" });
    waterOfficerMember = await createTestDepartmentMember({
      user: waterOfficerUser,
      department: waterDept,
      deptRole: "FIELD_OFFICER",
    });

    // 4. Complaints
    roadComplaint = await createTestComplaint({
      title: "Road Repair Needed",
      category: "Road",
      department: roadDept._id,
      status: "Pending",
    });

    waterComplaint = await createTestComplaint({
      title: "Water Leakage",
      category: "Water",
      department: waterDept._id,
      status: "Pending",
    });
  });

  describe("Allowed Department HEAD Operations", () => {
    it("should allow HEAD to view complaints belonging to their department (200 OK)", async () => {
      const response = await request(app)
        .get("/api/member/complaints")
        .set("Authorization", `Bearer ${roadHeadToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const complaints = response.body.complaints || response.body.data;
      const complaintIds = complaints.map(c => c._id.toString());
      expect(complaintIds).toContain(roadComplaint._id.toString());
      expect(complaintIds).not.toContain(waterComplaint._id.toString());
    });

    it("should allow HEAD to assign a Field Officer in their department (200 OK)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
        .set("Authorization", `Bearer ${roadHeadToken}`)
        .send({ memberId: roadOfficerMember._id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify DB Persistence & Timeline Entry
      const dbComplaint = await Complaint.findById(roadComplaint._id);
      expect(dbComplaint.assignedMember).toBeDefined();
      expect(dbComplaint.assignedMember.toString()).toBe(roadOfficerMember._id.toString());
      const timelineEvent = dbComplaint.timeline.find(t => t.type === "MEMBER_ASSIGNED");
      expect(timelineEvent).toBeDefined();
    });

    it("should allow HEAD to update status of department complaint (200 OK)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${roadComplaint._id}/status`)
        .set("Authorization", `Bearer ${roadHeadToken}`)
        .send({ status: "In Progress" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const dbComplaint = await Complaint.findById(roadComplaint._id);
      expect(dbComplaint.status).toBe("In Progress");
    });

    it("should allow HEAD to add an internal resolution note (201 Created)", async () => {
      const response = await request(app)
        .post(`/api/member/complaints/${roadComplaint._id}/notes`)
        .set("Authorization", `Bearer ${roadHeadToken}`)
        .send({ note: "Inspection scheduled for tomorrow morning." });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);

      const dbComplaint = await Complaint.findById(roadComplaint._id);
      expect(dbComplaint.notes.length).toBeGreaterThan(0);
      expect(dbComplaint.notes[0].text).toContain("Inspection scheduled");
    });

    it("should allow HEAD to view officers in their department (200 OK)", async () => {
      const response = await request(app)
        .get("/api/member/officers")
        .set("Authorization", `Bearer ${roadHeadToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const officers = response.body.officers || response.body.data;
      const officerIds = officers.map(o => o._id.toString());
      expect(officerIds).toContain(roadOfficerMember._id.toString());
    });

    it("should allow HEAD to view workload metrics (200 OK)", async () => {
      const response = await request(app)
        .get("/api/member/workload")
        .set("Authorization", `Bearer ${roadHeadToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("Complaint Detail Authorization (GET /api/member/complaints/:id)", () => {
    it("should return 200 OK when HEAD accesses their own department complaint", async () => {
      const response = await request(app)
        .get(`/api/member/complaints/${roadComplaint._id}`)
        .set("Authorization", `Bearer ${roadHeadToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.complaint._id.toString()).toBe(roadComplaint._id.toString());
    });

    it("should return 403 Forbidden when HEAD accesses a complaint from another department", async () => {
      const response = await request(app)
        .get(`/api/member/complaints/${waterComplaint._id}`)
        .set("Authorization", `Bearer ${roadHeadToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should return 404 Not Found when HEAD accesses a non-existent complaint ID", async () => {
      const { Types } = await import("mongoose");
      const nonExistentId = new Types.ObjectId().toHexString();

      const response = await request(app)
        .get(`/api/member/complaints/${nonExistentId}`)
        .set("Authorization", `Bearer ${roadHeadToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should return only Road department complaints when HEAD searches across complaints", async () => {
      // Create an additional Road complaint that matches the search term
      const roadLeakageComplaint = await createTestComplaint({
        title: "Water Leakage on Road Surface",
        description: "Water leakage flooding the road",
        category: "Road",
        department: roadDept._id,
        status: "Pending",
      });

      const response = await request(app)
        .get("/api/member/complaints?search=water+leakage")
        .set("Authorization", `Bearer ${roadHeadToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const complaints = response.body.complaints || response.body.data;
      const complaintIds = complaints.map((c) => c._id.toString());

      // Road complaint matching the search should appear
      expect(complaintIds).toContain(roadLeakageComplaint._id.toString());

      // The original water department complaint must never appear
      expect(complaintIds).not.toContain(waterComplaint._id.toString());

      // All returned complaints must belong to the Road department
      complaints.forEach((c) => {
        if (c.department) {
          const deptId = c.department._id?.toString() || c.department.toString();
          expect(deptId).toBe(roadDept._id.toString());
        }
      });
    });
  });

  describe("Forbidden Department HEAD Operations & Integrity Verification", () => {
    it("should reject HEAD attempt to access Admin portal (403 Forbidden)", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${roadHeadToken}`);

      expect(response.status).toBe(403);
    });

    it("should reject HEAD attempt to assign officer from another department (400 Bad Request)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
        .set("Authorization", `Bearer ${roadHeadToken}`)
        .send({ memberId: waterOfficerMember._id });

      expect(response.status).toBe(400);

      // Verify DB State Integrity: Complaint assignedMember remains unchanged
      const dbComplaint = await Complaint.findById(roadComplaint._id);
      expect(dbComplaint.assignedMember).toBeFalsy();
    });

    it("should reject HEAD attempt to view or manage complaints outside department (403/404)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${waterComplaint._id}/status`)
        .set("Authorization", `Bearer ${roadHeadToken}`)
        .send({ status: "Resolved" });

      expect([403, 404]).toContain(response.status);

      // Security Regression Check: Water complaint status unchanged
      const dbComplaint = await Complaint.findById(waterComplaint._id);
      expect(dbComplaint.status).toBe("Pending");
    });

    it("should reject HEAD attempt to delete complaints (403/404)", async () => {
      const response = await request(app)
        .delete(`/api/complaints/${roadComplaint._id}`)
        .set("Authorization", `Bearer ${roadHeadToken}`);

      expect([403, 404]).toContain(response.status);

      const dbComplaint = await Complaint.findById(roadComplaint._id);
      expect(dbComplaint).toBeDefined();
    });
  });
});
