/**
 * @file departmentAssignment.test.js
 * @description API Test suite for Module 3: Admin Department Assignment.
 */

import request from "supertest";
import { jest } from "@jest/globals";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import {
  createTestUser,
  createTestDepartment,
  createTestComplaint,
  generateTestToken,
} from "../helpers/authHelper.js";
import { notificationService } from "../../src/notifications/services/NotificationService.js";

describe("PATCH /api/complaints/:id/assign-department (Admin Department Assignment)", () => {
  let adminUser;
  let adminToken;
  let citizenUser;
  let citizenToken;
  let roadDept;
  let waterDept;
  let complaint;

  beforeEach(async () => {
    jest.spyOn(notificationService, "dispatch").mockImplementation(() => Promise.resolve());

    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });

    citizenUser = await createTestUser({ role: "user" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });

    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });
    waterDept = await createTestDepartment({ name: "Water Department", code: "WATER" });

    complaint = await createTestComplaint({
      createdBy: citizenUser._id,
      department: roadDept._id,
    });
  });

  it("should allow admin to assign/override complaint department (200 OK)", async () => {
    const response = await request(app)
      .patch(`/api/complaints/${complaint._id}/assign-department`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ departmentId: waterDept._id });

    // 1. Verify HTTP Status & Response Body
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("Department assigned successfully");

    // 2. Verify Database Persistence
    const updatedDb = await Complaint.findById(complaint._id);
    expect(updatedDb.department.toString()).toBe(waterDept._id.toString());

    // 3. Verify Timeline Entry
    const latestTimeline = updatedDb.timeline[updatedDb.timeline.length - 1];
    expect(latestTimeline.type).toBe("DEPARTMENT_ASSIGNED");
    expect(latestTimeline.performedBy.toString()).toBe(adminUser._id.toString());
  });

  it("should reject department assignment attempt by non-admin user (403 Forbidden)", async () => {
    const response = await request(app)
      .patch(`/api/complaints/${complaint._id}/assign-department`)
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ departmentId: waterDept._id });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
});
