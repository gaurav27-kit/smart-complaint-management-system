/**
 * @file statusWorkflow.test.js
 * @description API Test suite for Module 6: Complaint Status Workflow & State Transitions.
 */

import request from "supertest";
import { jest } from "@jest/globals";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import {
  createTestUser,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint,
  generateTestToken,
} from "../helpers/authHelper.js";
import { notificationService } from "../../src/notifications/services/NotificationService.js";

describe("Status Workflow Transitions (PATCH /api/member/complaints/:id/status)", () => {
  let roadDept;
  let officerUser;
  let officerMember;
  let officerToken;
  let complaint;

  beforeEach(async () => {
    jest.spyOn(notificationService, "dispatch").mockImplementation(() => Promise.resolve());

    roadDept = await createTestDepartment({ name: "Road Dept", code: "ROAD" });
    officerUser = await createTestUser({ role: "department_member" });
    officerMember = await createTestDepartmentMember({
      user: officerUser,
      department: roadDept,
      deptRole: "FIELD_OFFICER",
    });
    officerToken = generateTestToken({ id: officerUser._id, role: "department_member" });

    complaint = await createTestComplaint({
      department: roadDept._id,
      assignedMember: officerMember._id,
      status: "Pending",
    });
  });

  it("should transition status from Pending -> In Progress (200 OK)", async () => {
    const response = await request(app)
      .patch(`/api/member/complaints/${complaint._id}/status`)
      .set("Authorization", `Bearer ${officerToken}`)
      .send({ status: "In Progress" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedDb = await Complaint.findById(complaint._id);
    expect(updatedDb.status).toBe("In Progress");
  });

  it("should transition status from In Progress -> Resolved (200 OK)", async () => {
    // Set to In Progress first
    await Complaint.findByIdAndUpdate(complaint._id, { status: "In Progress" });

    const response = await request(app)
      .patch(`/api/member/complaints/${complaint._id}/status`)
      .set("Authorization", `Bearer ${officerToken}`)
      .send({ status: "Resolved" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedDb = await Complaint.findById(complaint._id);
    expect(updatedDb.status).toBe("Resolved");
  });

  it("should transition status from Resolved -> Closed (200 OK)", async () => {
    // Set to Resolved first
    await Complaint.findByIdAndUpdate(complaint._id, { status: "Resolved" });

    const response = await request(app)
      .patch(`/api/member/complaints/${complaint._id}/status`)
      .set("Authorization", `Bearer ${officerToken}`)
      .send({ status: "Closed" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedDb = await Complaint.findById(complaint._id);
    expect(updatedDb.status).toBe("Closed");
  });

  it("should reject transition to an invalid status string (400 Bad Request)", async () => {
    const response = await request(app)
      .patch(`/api/member/complaints/${complaint._id}/status`)
      .set("Authorization", `Bearer ${officerToken}`)
      .send({ status: "InvalidStatusState" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
