/**
 * @file notes.test.js
 * @description API Test suite for Module 8: Complaint Notes & Comments.
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

describe("POST /api/member/complaints/:id/notes (Internal Notes)", () => {
  let roadDept;
  let officerUser;
  let officerMember;
  let officerToken;
  let citizenUser;
  let citizenToken;
  let complaint;

  beforeEach(async () => {
    jest.spyOn(notificationService, "dispatch").mockImplementation(() => Promise.resolve());

    roadDept = await createTestDepartment({ name: "Road Dept", code: "ROAD" });

    officerUser = await createTestUser({ fullName: "Officer Smith", role: "department_member" });
    officerMember = await createTestDepartmentMember({
      user: officerUser,
      department: roadDept,
      deptRole: "FIELD_OFFICER",
    });
    officerToken = generateTestToken({ id: officerUser._id, role: "department_member" });

    citizenUser = await createTestUser({ role: "user" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });

    complaint = await createTestComplaint({
      department: roadDept._id,
      assignedMember: officerMember._id,
    });
  });

  it("should allow a department member to add an internal note (201 Created / 200 OK)", async () => {
    const response = await request(app)
      .post(`/api/member/complaints/${complaint._id}/notes`)
      .set("Authorization", `Bearer ${officerToken}`)
      .send({ note: "Inspection scheduled for tomorrow morning." });

    expect([200, 201]).toContain(response.status);
    expect(response.body.success).toBe(true);

    // 1. Verify Notes Array Persistence in DB
    const updatedDb = await Complaint.findById(complaint._id);
    expect(updatedDb.notes.length).toBeGreaterThan(0);
    const addedNote = updatedDb.notes[updatedDb.notes.length - 1];
    expect(addedNote.text).toBe("Inspection scheduled for tomorrow morning.");

    // 2. Verify Timeline Entry Generated
    const timelineEntry = updatedDb.timeline.find(t => t.title === "Internal Note Added" || t.type === "ADMIN_COMMENT" || t.type === "STATUS_UPDATED");
    expect(timelineEntry).toBeDefined();
  });

  it("should reject adding note by a citizen (403 Forbidden)", async () => {
    const response = await request(app)
      .post(`/api/member/complaints/${complaint._id}/notes`)
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ note: "Citizen trying to add internal note" });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
});
