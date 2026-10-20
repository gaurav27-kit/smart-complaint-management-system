/**
 * @file createComplaint.test.js
 * @description API Test suite for POST /api/complaints endpoint and Automatic Department Routing.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import Department from "../../src/models/Department.js";
import { createTestUser, generateTestToken } from "../helpers/authHelper.js";
import { buildComplaintPayload } from "../helpers/testDataFactory.js";

describe("POST /api/complaints (Create Complaint & Automatic Routing)", () => {
  let citizenUser;
  let citizenToken;

  beforeEach(async () => {
    citizenUser = await createTestUser({ role: "user" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });
  });

  describe("Module 1: Create Complaint", () => {
    it("should successfully create a complaint with valid payload (201 Created)", async () => {
      const payload = buildComplaintPayload({
        title: "Pothole on Main Street",
        description: "Large pothole causing traffic issues near central market.",
        category: "Road",
        location: "Main Street, Market Area",
        priority: "High",
      });

      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(payload);

      // 1. Verify HTTP Status & Response Body
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Complaint created successfully");
      expect(response.body.complaint).toBeDefined();
      expect(response.body.complaint.title).toBe("Pothole on Main Street");

      // 2. Verify Database Persistence
      const dbComplaint = await Complaint.findById(response.body.complaint._id);
      expect(dbComplaint).not.toBeNull();
      expect(dbComplaint.createdBy.toString()).toBe(citizenUser._id.toString());
      expect(dbComplaint.status).toBe("Pending");

      // 3. Verify Initial Timeline Entry
      expect(dbComplaint.timeline).toHaveLength(1);
      expect(dbComplaint.timeline[0].type).toBe("COMPLAINT_CREATED");
      expect(dbComplaint.timeline[0].performedBy.toString()).toBe(citizenUser._id.toString());
    });

    it("should reject creation when title is missing (400 Bad Request)", async () => {
      const payload = buildComplaintPayload();
      delete payload.title;

      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject creation when category is invalid (400 Bad Request)", async () => {
      const payload = buildComplaintPayload({ category: "InvalidCategoryName" });

      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject creation when priority is invalid (400 Bad Request)", async () => {
      const payload = buildComplaintPayload({ priority: "CriticalMax" });

      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject request when JWT is missing (401 Unauthorized)", async () => {
      const payload = buildComplaintPayload();

      const response = await request(app)
        .post("/api/complaints")
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject request when JWT is invalid (401 Unauthorized)", async () => {
      const payload = buildComplaintPayload();

      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", "Bearer invalid_token_12345")
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Module 2: Automatic Department Routing", () => {
    let roadDept, waterDept, garbageDept, electricDept, itDept, healthDept, safetyDept;

    beforeEach(async () => {
      roadDept = await Department.create({ name: "Road Department", code: "ROAD" });
      waterDept = await Department.create({ name: "Water Department", code: "WATER" });
      garbageDept = await Department.create({ name: "Garbage Department", code: "GARBAGE" });
      electricDept = await Department.create({ name: "Electricity Department", code: "ELECTRIC" });
      itDept = await Department.create({ name: "IT Department", code: "IT" });
      healthDept = await Department.create({ name: "Health Department", code: "HEALTH" });
      safetyDept = await Department.create({ name: "Public Safety Department", code: "SAFETY" });
    });

    it("should automatically route Road complaints to Road Department", async () => {
      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(buildComplaintPayload({ category: "Road" }));

      expect(response.status).toBe(201);
      const dbComplaint = await Complaint.findById(response.body.complaint._id);
      expect(dbComplaint.department.toString()).toBe(roadDept._id.toString());
    });

    it("should automatically route Water complaints to Water Department", async () => {
      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(buildComplaintPayload({ category: "Water" }));

      expect(response.status).toBe(201);
      const dbComplaint = await Complaint.findById(response.body.complaint._id);
      expect(dbComplaint.department.toString()).toBe(waterDept._id.toString());
    });

    it("should automatically route Garbage complaints to Garbage Department", async () => {
      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(buildComplaintPayload({ category: "Garbage" }));

      expect(response.status).toBe(201);
      const dbComplaint = await Complaint.findById(response.body.complaint._id);
      expect(dbComplaint.department.toString()).toBe(garbageDept._id.toString());
    });

    it("should automatically route Electricity complaints to Electricity Department", async () => {
      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(buildComplaintPayload({ category: "Electricity" }));

      expect(response.status).toBe(201);
      const dbComplaint = await Complaint.findById(response.body.complaint._id);
      expect(dbComplaint.department.toString()).toBe(electricDept._id.toString());
    });

    it("should automatically route IT complaints to IT Department", async () => {
      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(buildComplaintPayload({ category: "IT" }));

      expect(response.status).toBe(201);
      const dbComplaint = await Complaint.findById(response.body.complaint._id);
      expect(dbComplaint.department.toString()).toBe(itDept._id.toString());
    });

    it("should leave department as null for 'Other' category complaints", async () => {
      const response = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${citizenToken}`)
        .send(buildComplaintPayload({ category: "Other" }));

      expect(response.status).toBe(201);
      const dbComplaint = await Complaint.findById(response.body.complaint._id);
      expect(dbComplaint.department).toBeNull();
    });
  });
});
