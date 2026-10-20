/**
 * @file resolutionProof.test.js
 * @description Test uploadMemberResolutionProof Cloudinary failure handling.
 */

import request from "supertest";
import { PassThrough } from "stream";
import { jest } from "@jest/globals";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import cloudinary from "../../src/config/cloudinary.js";
import {
  createTestUser,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint,
  generateTestToken,
} from "../helpers/authHelper.js";

describe("POST /api/member/complaints/:id/proof", () => {
  let memberUser;
  let memberToken;
  let department;
  let complaint;

  beforeEach(async () => {
    department = await createTestDepartment();
    memberUser = await createTestUser({ role: "department_member" });
    const memberRecord = await createTestDepartmentMember({
      user: memberUser,
      department: department,
      deptRole: "FIELD_OFFICER",
      isActive: true,
    });

    complaint = await createTestComplaint({
      department: department._id,
      assignedMember: memberRecord._id,
      status: "In Progress",
      resolutionProof: [],
    });

    memberToken = generateTestToken({
      id: memberUser._id,
      role: memberUser.role,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 500 and not save partial proof if Cloudinary upload fails", async () => {
    jest.spyOn(cloudinary.uploader, "upload_stream").mockImplementation((options, callback) => {
      const stream = new PassThrough();
      setImmediate(() => {
        callback(new Error("Cloudinary connection timeout"), null);
      });
      return stream;
    });

    const response = await request(app)
      .post(`/api/member/complaints/${complaint._id}/proof`)
      .set("Authorization", `Bearer ${memberToken}`)
      .attach("images", Buffer.from("fake file content"), "test_proof.jpg");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Failed to upload resolution proof file");

    // Verify database was NOT modified with partial/placeholder data
    const updatedComplaint = await Complaint.findById(complaint._id);
    expect(updatedComplaint.resolutionProof).toHaveLength(0);
  });
});
