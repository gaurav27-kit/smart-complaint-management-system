/**
 * @file citizenPermissions.test.js
 * @description API Test suite for Module 1: Citizen Role Permissions & Boundaries.
 * Validates allowed citizen actions and enforces strict security boundary checks against unauthorized actions.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import Complaint from "../../src/models/Complaint.js";
import {
  createTestUser,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint,
  generateTestToken,
} from "../helpers/authHelper.js";

describe("Module 1: Citizen Role Permissions & Boundaries", () => {
  let citizenUser;
  let citizenToken;
  let otherCitizenUser;
  let otherCitizenToken;
  let otherComplaint;
  let roadDept;

  beforeEach(async () => {
    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });

    citizenUser = await createTestUser({
      fullName: "Jane Citizen",
      email: "jane.citizen@example.com",
      role: "user",
      emailVerified: true,
    });
    citizenToken = generateTestToken({ id: citizenUser._id, role: citizenUser.role });

    otherCitizenUser = await createTestUser({
      fullName: "Bob Citizen",
      email: "bob.citizen@example.com",
      role: "user",
      emailVerified: true,
    });
    otherCitizenToken = generateTestToken({ id: otherCitizenUser._id, role: otherCitizenUser.role });

    otherComplaint = await createTestComplaint({
      title: "Pothole on Main Street",
      description: "Deep pothole causing traffic issues",
      category: "Road",
      department: roadDept._id,
      createdBy: otherCitizenUser._id,
    });
  });

  describe("Allowed Citizen Operations", () => {
    it("should allow Citizen to register a new user account (201 Created)", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          fullName: "New Citizen User",
          email: "new.citizen@example.com",
          password: "password123",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      const userObj = response.body.data || response.body.user;
      expect(userObj.email).toBe("new.citizen@example.com");

      // DB verification
      const dbUser = await User.findOne({ email: "new.citizen@example.com" });
      expect(dbUser).toBeDefined();
      expect(dbUser.role).toBe("user");
    });

    it("should allow Citizen to log in (200 OK)", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "jane.citizen@example.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it("should allow Citizen to create a complaint (201 Created)", async () => {
      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({
          title: "Broken Streetlight on 5th Ave",
          description: "Light flickering constantly",
          category: "Road",
          location: "5th Ave, City",
          priority: "Medium",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      const createdComplaint = response.body.data || response.body.complaint;
      expect(createdComplaint.createdBy.toString()).toBe(citizenUser._id.toString());

      // DB persistence & Timeline check
      const dbComplaint = await Complaint.findById(createdComplaint._id);
      expect(dbComplaint).toBeDefined();
      expect(dbComplaint.timeline.length).toBeGreaterThan(0);
    });

    it("should allow Citizen to view their own complaints (200 OK)", async () => {
      const citizenComplaint = await createTestComplaint({
        createdBy: citizenUser._id,
        category: "Road",
      });

      const response = await request(app)
        .get(`/api/complaints/${citizenComplaint._id}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const fetchedComplaint = response.body.data || response.body.complaint;
      expect(fetchedComplaint._id.toString()).toBe(citizenComplaint._id.toString());
    });

    it("should allow Citizen to update their own complaint (200 OK)", async () => {
      const citizenComplaint = await createTestComplaint({
        createdBy: citizenUser._id,
        title: "Original Title",
      });

      const response = await request(app)
        .patch(`/api/complaints/${citizenComplaint._id}`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ title: "Updated Title By Owner" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const dbComplaint = await Complaint.findById(citizenComplaint._id);
      expect(dbComplaint.title).toBe("Updated Title By Owner");
    });

    it("should allow Citizen to delete their own complaint (200 OK)", async () => {
      const citizenComplaint = await createTestComplaint({
        createdBy: citizenUser._id,
      });

      const response = await request(app)
        .delete(`/api/complaints/${citizenComplaint._id}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const dbComplaint = await Complaint.findById(citizenComplaint._id);
      expect(dbComplaint).toBeNull();
    });
  });

  describe("Forbidden Citizen Operations & Security Integrity Verification", () => {
    it("should reject Citizen attempt to access Admin dashboard (403 Forbidden)", async () => {
      const response = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it("should reject Citizen attempt to access Member HEAD endpoints (403/404)", async () => {
      const response = await request(app)
        .get("/api/member/officers")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect([400, 403, 404]).toContain(response.status);
    });

    it("should reject Citizen attempt to assign departments (403 Forbidden)", async () => {
      const response = await request(app)
        .patch(`/api/complaints/${otherComplaint._id}/assign-department`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ departmentId: roadDept._id });

      expect(response.status).toBe(403);

      // Verify DB State Integrity: Department remains unchanged
      const dbComplaint = await Complaint.findById(otherComplaint._id);
      expect(dbComplaint.department.toString()).toBe(roadDept._id.toString());
    });

    it("should reject Citizen attempt to assign officers (403/404)", async () => {
      const response = await request(app)
        .patch(`/api/member/complaints/${otherComplaint._id}/assign`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ officerId: citizenUser._id });

      expect([403, 404]).toContain(response.status);

      // Verify DB State Integrity: Assigned member remains unchanged
      const dbComplaint = await Complaint.findById(otherComplaint._id);
      expect(dbComplaint.assignedMember).toBeFalsy();
    });

    it("should reject Citizen attempt to view another citizen's complaint (404/403)", async () => {
      const response = await request(app)
        .get(`/api/complaints/${otherComplaint._id}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect([403, 404]).toContain(response.status);
    });

    it("should reject Citizen attempt to update another citizen's complaint (404/403) and maintain DB integrity", async () => {
      const originalTitle = otherComplaint.title;

      const response = await request(app)
        .patch(`/api/complaints/${otherComplaint._id}`)
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({ title: "Hacked Title Attempt" });

      expect([403, 404]).toContain(response.status);

      // Security Regression & DB Integrity Check
      const dbComplaint = await Complaint.findById(otherComplaint._id);
      expect(dbComplaint.title).toBe(originalTitle);
      expect(dbComplaint.timeline.length).toBe(otherComplaint.timeline.length);
    });

    it("should reject Citizen attempt to delete another citizen's complaint (404/403) and maintain DB integrity", async () => {
      const response = await request(app)
        .delete(`/api/complaints/${otherComplaint._id}`)
        .set("Authorization", `Bearer ${citizenToken}`);

      expect([403, 404]).toContain(response.status);

      // Security Regression Check: Complaint document still exists
      const dbComplaint = await Complaint.findById(otherComplaint._id);
      expect(dbComplaint).toBeDefined();
      expect(dbComplaint._id.toString()).toBe(otherComplaint._id.toString());
    });

    it("should prevent privilege escalation: Citizen cannot update role during registration or login", async () => {
      const regResponse = await request(app)
        .post("/api/auth/register")
        .send({
          fullName: "Privilege Escalation Tester",
          email: "hacker.user@example.com",
          password: "password123",
          role: "admin", // Malicious payload
        });

      expect(regResponse.status).toBe(201);
      const dbUser = await User.findOne({ email: "hacker.user@example.com" });
      expect(dbUser.role).toBe("user"); // Must default to user role
    });
  });
});
