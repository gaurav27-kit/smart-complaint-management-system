/**
 * @file adminPermissions.test.js
 * @description API Test suite for Module 2: Admin Role Permissions & Administrative Scope.
 * Validates global access rights for administrators and verifies absence of artificial scope restrictions.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import Complaint from "../../src/models/Complaint.js";
import Department from "../../src/models/Department.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import {
  createTestUser,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint,
  generateTestToken,
} from "../helpers/authHelper.js";

describe("Module 2: Admin Role Permissions & Administrative Scope", () => {
  let adminUser;
  let adminToken;
  let roadDept;
  let waterDept;
  let citizenUser;
  let roadComplaint;
  let waterComplaint;

  beforeEach(async () => {
    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });
    waterDept = await createTestDepartment({ name: "Water Department", code: "WATER" });

    adminUser = await createTestUser({
      fullName: "System Admin",
      email: "admin.user@example.com",
      role: "admin",
      emailVerified: true,
    });
    adminToken = generateTestToken({ id: adminUser._id, role: adminUser.role });

    citizenUser = await createTestUser({ role: "user" });

    roadComplaint = await createTestComplaint({
      title: "Road Repair Needed",
      category: "Road",
      department: roadDept._id,
      createdBy: citizenUser._id,
    });

    waterComplaint = await createTestComplaint({
      title: "Water Pipe Leak",
      category: "Water",
      department: waterDept._id,
      createdBy: citizenUser._id,
    });
  });

  describe("Admin Global Access & Operations", () => {
    it("should allow Admin to view dashboard metrics (200 OK)", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const dashboard = response.body.dashboard || response.body.data;
      expect(dashboard).toBeDefined();
    });

    it("should allow Admin to view all complaints across all departments (200 OK)", async () => {
      const response = await request(app)
        .get("/api/admin/complaints")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const complaints = response.body.complaints || response.body.data;
      expect(complaints.length).toBeGreaterThanOrEqual(2);
    });

    it("should allow Admin to assign and override complaint department (200 OK)", async () => {
      const response = await request(app)
        .patch(`/api/complaints/${roadComplaint._id}/assign-department`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ departmentId: waterDept._id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify DB Persistence & Timeline Entry
      const dbComplaint = await Complaint.findById(roadComplaint._id);
      expect(dbComplaint.department.toString()).toBe(waterDept._id.toString());
      const timelineEvent = dbComplaint.timeline.find(t => t.title === "Department Assigned");
      expect(timelineEvent).toBeDefined();
    });

    it("should allow Admin to create a new department member (201 Created)", async () => {
      const memberUser = await createTestUser({ email: "new.officer@example.com", role: "department_member" });

      const response = await request(app)
        .post(`/api/departments/${roadDept._id}/members`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userId: memberUser._id,
          deptRole: "FIELD_OFFICER",
          employeeId: "EMP-9901",
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);

      const dbMember = await DepartmentMember.findOne({ user: memberUser._id });
      expect(dbMember).toBeDefined();
      expect(dbMember.department.toString()).toBe(roadDept._id.toString());
    });

    it("should allow Admin to remove / soft delete department members (200 OK)", async () => {
      const memberUser = await createTestUser({ role: "department_member" });
      const deptMember = await createTestDepartmentMember({
        user: memberUser,
        department: roadDept,
        isActive: true,
      });

      const response = await request(app)
        .delete(`/api/departments/members/${deptMember._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const dbMember = await DepartmentMember.findById(deptMember._id);
      expect(dbMember.isActive).toBe(false);
    });

    it("should allow Admin to view analytics (200 OK)", async () => {
      const response = await request(app)
        .get("/api/admin/analytics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const analytics = response.body.analytics || response.body.data;
      expect(analytics).toBeDefined();
    });
  });

  describe("Admin Boundary & Non-Restriction Checks", () => {
    it("should NOT restrict Admin by department scope when viewing single complaint details", async () => {
      const response = await request(app)
        .get(`/api/admin/complaints/${waterComplaint._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const complaintObj = response.body.complaint || response.body.data;
      expect(complaintObj._id.toString()).toBe(waterComplaint._id.toString());
    });

    it("should allow Admin to update status of any complaint (200 OK)", async () => {
      const response = await request(app)
        .patch(`/api/admin/complaints/${waterComplaint._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "In Progress" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const dbComplaint = await Complaint.findById(waterComplaint._id);
      expect(dbComplaint.status).toBe("In Progress");
    });

    it("should safely handle special regex characters in search without throwing or injecting regex", async () => {
      // Query with unbalanced regex characters that would break unescaped regex
      const response = await request(app)
        .get("/api/admin/complaints?search=(unclosed[.*+?^${}()|")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.complaints)).toBe(true);
    });
  });
});
