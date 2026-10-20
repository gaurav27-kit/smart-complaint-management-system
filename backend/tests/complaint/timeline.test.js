/**
 * @file timeline.test.js
 * @description API Test suite for Module 7: Complaint Timeline Chronology & Integrity.
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

describe("GET /api/complaints/:id/timeline (Timeline Integrity)", () => {
  let citizenUser;
  let citizenToken;
  let adminUser;
  let adminToken;
  let roadDept;
  let headUser;
  let headMember;
  let headToken;
  let officerUser;
  let officerMember;
  let officerToken;
  let complaint;

  beforeEach(async () => {
    jest.spyOn(notificationService, "dispatch").mockImplementation(() => Promise.resolve());

    citizenUser = await createTestUser({ role: "user" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });

    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });

    roadDept = await createTestDepartment({ name: "Road Dept", code: "ROAD" });

    // Setup HEAD and Officer
    headUser = await createTestUser({ role: "department_member" });
    headMember = await createTestDepartmentMember({
      user: headUser,
      department: roadDept,
      deptRole: "HEAD",
    });
    headToken = generateTestToken({ id: headUser._id, role: "department_member" });

    officerUser = await createTestUser({ role: "department_member" });
    officerMember = await createTestDepartmentMember({
      user: officerUser,
      department: roadDept,
      deptRole: "FIELD_OFFICER",
    });
    officerToken = generateTestToken({ id: officerUser._id, role: "department_member" });

    // 1. Create complaint (COMPLAINT_CREATED)
    complaint = await createTestComplaint({ createdBy: citizenUser._id });

    // 2. Assign Department (DEPARTMENT_ASSIGNED)
    await request(app)
      .patch(`/api/complaints/${complaint._id}/assign-department`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ departmentId: roadDept._id });

    // 3. Assign Field Officer by HEAD (MEMBER_ASSIGNED)
    await request(app)
      .patch(`/api/member/complaints/${complaint._id}/assign`)
      .set("Authorization", `Bearer ${headToken}`)
      .send({ memberId: officerMember._id });

    // 4. Update Status (STATUS_CHANGED)
    await request(app)
      .patch(`/api/member/complaints/${complaint._id}/status`)
      .set("Authorization", `Bearer ${officerToken}`)
      .send({ status: "In Progress" });

    // 5. Add Internal Note (ADMIN_COMMENT / STATUS_UPDATED)
    await request(app)
      .post(`/api/member/complaints/${complaint._id}/notes`)
      .set("Authorization", `Bearer ${officerToken}`)
      .send({ note: "Work underway." });
  });

  it("should retrieve full timeline history in chronological order (200 OK)", async () => {
    const response = await request(app)
      .get(`/api/complaints/${complaint._id}/timeline`)
      .set("Authorization", `Bearer ${citizenToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.timeline).toBeDefined();
    expect(response.body.timeline.length).toBeGreaterThanOrEqual(4);

    // Verify timeline event presence
    const timelineTypes = response.body.timeline.map(t => t.type);
    expect(timelineTypes).toContain("COMPLAINT_CREATED");
    expect(timelineTypes).toContain("DEPARTMENT_ASSIGNED");

    // Verify DB integrity
    const dbComplaint = await Complaint.findById(complaint._id);
    expect(dbComplaint.timeline.length).toBeGreaterThanOrEqual(4);
  });
});
