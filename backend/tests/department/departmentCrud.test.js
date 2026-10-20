/**
 * @file departmentCrud.test.js
 * @description API Test suite for Module 1: Department CRUD Operations.
 * Verifies department creation, updating, listing, filtering, duplicate code/name rejection, and RBAC authorization.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Department from "../../src/models/Department.js";
import { createTestUser, generateTestToken, createTestDepartment } from "../helpers/authHelper.js";

describe("Module 1: Department CRUD Operations", () => {
  let adminToken;
  let citizenToken;
  let adminUser;
  let citizenUser;

  beforeEach(async () => {
    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });

    citizenUser = await createTestUser({ role: "user" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });
  });

  describe("Admin Department Management", () => {
    it("should allow Admin to create a new department (201 Created)", async () => {
      const response = await request(app)
        .post("/api/departments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Sanitation & Waste Management",
          code: "sanitation",
          description: "Handles city sanitation",
          email: "sanitation@city.gov",
          phone: "+1234567890",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.department).toBeDefined();
      expect(response.body.department.code).toBe("SANITATION"); // Upper-case normalization

      // DB Persistence check
      const dbDept = await Department.findOne({ code: "SANITATION" });
      expect(dbDept).toBeDefined();
      expect(dbDept.name).toBe("Sanitation & Waste Management");
    });

    it("should allow Admin to update an existing department (200 OK)", async () => {
      const dept = await createTestDepartment({ name: "Old Name", code: "OLD_CODE" });

      const response = await request(app)
        .put(`/api/departments/${dept._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Updated Department Name",
          description: "Updated description text.",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const dbDept = await Department.findById(dept._id);
      expect(dbDept.name).toBe("Updated Department Name");
      expect(dbDept.description).toBe("Updated description text.");
    });

    it("should allow Admin to view all departments with pagination (200 OK)", async () => {
      await createTestDepartment({ name: "Dept A", code: "DEPT_A" });
      await createTestDepartment({ name: "Dept B", code: "DEPT_B" });

      const response = await request(app)
        .get("/api/departments")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.departments).toBeDefined();
      expect(response.body.departments.length).toBeGreaterThanOrEqual(2);
    });

    it("should allow filtering active and inactive departments (200 OK)", async () => {
      await createTestDepartment({ name: "Active Dept", code: "ACT_DEPT", isActive: true });
      await createTestDepartment({ name: "Inactive Dept", code: "INACT_DEPT", isActive: false });

      // Active Filter
      const activeRes = await request(app)
        .get("/api/departments?isActive=true")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(activeRes.status).toBe(200);
      const activeCodes = activeRes.body.departments.map(d => d.code);
      expect(activeCodes).toContain("ACT_DEPT");
      expect(activeCodes).not.toContain("INACT_DEPT");

      // Inactive Filter
      const inactiveRes = await request(app)
        .get("/api/departments?isActive=false")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(inactiveRes.status).toBe(200);
      const inactiveCodes = inactiveRes.body.departments.map(d => d.code);
      expect(inactiveCodes).toContain("INACT_DEPT");
      expect(inactiveCodes).not.toContain("ACT_DEPT");
    });
  });

  describe("Validation & Conflict Rejections", () => {
    it("should reject duplicate department code (409 Conflict)", async () => {
      await createTestDepartment({ name: "First Dept", code: "DUP_CODE" });

      const response = await request(app)
        .post("/api/departments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Second Dept",
          code: "dup_code", // Case-insensitive duplicate
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it("should reject duplicate department name (409 Conflict)", async () => {
      await createTestDepartment({ name: "Unique Name Dept", code: "CODE_1" });

      const response = await request(app)
        .post("/api/departments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Unique Name Dept",
          code: "CODE_2",
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it("should reject creation when required fields are missing (400 Bad Request)", async () => {
      const response = await request(app)
        .post("/api/departments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ description: "Missing name and code" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject invalid ObjectId format (400 Bad Request)", async () => {
      const response = await request(app)
        .get("/api/departments/invalid_object_id_string")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject creation attempt by non-admin Citizen (403 Forbidden)", async () => {
      const response = await request(app)
        .post("/api/departments")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send({
          name: "Unauthorized Dept",
          code: "UNAUTH",
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
