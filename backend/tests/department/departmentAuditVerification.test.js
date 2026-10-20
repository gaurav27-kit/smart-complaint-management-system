/**
 * @file departmentAuditVerification.test.js
 * @description API & Data Integrity Test suite for Module 13 & Module 14: Audit, Timeline & Database Relationship Integrity.
 * Verifies timeline audit trail generation for assignments/reassignments and checks database relationship integrity.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import User from "../../src/models/User.js";
import Department from "../../src/models/Department.js";
import {
  createTestUser,
  generateTestToken,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint,
} from "../helpers/authHelper.js";

describe("Module 13 & Module 14: Audit, Timeline & Database Relationship Integrity", () => {
  let adminToken;
  let roadHeadToken;
  let roadDept;
  let roadHeadUser;
  let officer1Member;
  let officer2Member;
  let roadComplaint;

  beforeEach(async () => {
    adminToken = generateTestToken({ id: (await createTestUser({ role: "admin" }))._id, role: "admin" });
    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });

    // HEAD
    roadHeadUser = await createTestUser({ role: "department_member" });
    await createTestDepartmentMember({ user: roadHeadUser, department: roadDept, deptRole: "HEAD" });
    roadHeadToken = generateTestToken({ id: roadHeadUser._id, role: "department_member" });

    // Officer 1
    const o1User = await createTestUser({ role: "department_member" });
    officer1Member = await createTestDepartmentMember({ user: o1User, department: roadDept, deptRole: "FIELD_OFFICER" });

    // Officer 2
    const o2User = await createTestUser({ role: "department_member" });
    officer2Member = await createTestDepartmentMember({ user: o2User, department: roadDept, deptRole: "FIELD_OFFICER" });

    // Complaint
    roadComplaint = await createTestComplaint({ title: "Pothole Audit Test", category: "Road", department: roadDept._id });
  });

  describe("Audit & Timeline Logging for Operations", () => {
    it("should record timeline event on initial complaint assignment to Field Officer", async () => {
      await request(app)
        .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
        .set("Authorization", `Bearer ${roadHeadToken}`)
        .send({ memberId: officer1Member._id });

      const dbComplaint = await Complaint.findById(roadComplaint._id);
      const assignEvent = dbComplaint.timeline.find(t => t.type === "MEMBER_ASSIGNED");

      expect(assignEvent).toBeDefined();
      expect(assignEvent.title).toBe("Complaint Assigned");
      expect(assignEvent.performedBy.toString()).toBe(roadHeadUser._id.toString());
    });

    it("should record reassignment timeline event when switching assigned Field Officer", async () => {
      // 1. Initial assignment
      await request(app)
        .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
        .set("Authorization", `Bearer ${roadHeadToken}`)
        .send({ memberId: officer1Member._id });

      // 2. Reassignment
      await request(app)
        .patch(`/api/member/complaints/${roadComplaint._id}/assign`)
        .set("Authorization", `Bearer ${roadHeadToken}`)
        .send({ memberId: officer2Member._id });

      const dbComplaint = await Complaint.findById(roadComplaint._id);
      const reassignEvent = dbComplaint.timeline.find(t => t.title === "Complaint Reassigned");

      expect(reassignEvent).toBeDefined();
      expect(dbComplaint.assignedMember.toString()).toBe(officer2Member._id.toString());
    });
  });

  describe("Database Relationship & Key Integrity", () => {
    it("should verify no duplicate department codes or names exist in Department collection", async () => {
      const departments = await Department.find({});
      const names = departments.map(d => d.name);
      const codes = departments.map(d => d.code);

      expect(new Set(names).size).toBe(names.length);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it("should verify no duplicate Employee IDs exist in User collection", async () => {
      const users = await User.find({ employeeId: { $exists: true, $ne: "" } });
      const empIds = users.map(u => u.employeeId);

      expect(new Set(empIds).size).toBe(empIds.length);
    });

    it("should verify all DepartmentMember records point to valid existing Department & User ObjectIds", async () => {
      const members = await DepartmentMember.find({}).lean();

      for (const m of members) {
        const dept = await Department.findById(m.department);
        const user = await User.findById(m.user);

        expect(dept).not.toBeNull();
        expect(user).not.toBeNull();
      }
    });
  });
});
