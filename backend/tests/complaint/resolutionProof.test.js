/**
 * @file resolutionProof.test.js
 * @description API Test suite for Module 9: Resolution Proof Upload.
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

describe("POST /api/member/complaints/:id/proof (Resolution Proof)", () => {
  let roadDept;
  let officerUser;
  let officerMember;
  let officerToken;
  let complaint;

  beforeEach(async () => {
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
      status: "In Progress",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should successfully upload a resolution proof file (200 OK or 201 Created)", async () => {
    jest.spyOn(cloudinary.uploader, "upload_stream").mockImplementation((options, callback) => {
      const stream = new PassThrough();
      setImmediate(() => {
        callback(null, {
          url: "http://res.cloudinary.com/demo/image/upload/v12345/proof.jpg",
          secure_url: "https://res.cloudinary.com/demo/image/upload/v12345/proof.jpg",
          public_id: "scms/complaints/test/proof",
          width: 800,
          height: 600,
          format: "jpg",
        });
      });
      return stream;
    });

    const buffer = Buffer.from("fake image data binary content");

    const response = await request(app)
      .post(`/api/member/complaints/${complaint._id}/proof`)
      .set("Authorization", `Bearer ${officerToken}`)
      .attach("images", buffer, "resolution_proof.jpg");

    expect([200, 201]).toContain(response.status);
    expect(response.body.success).toBe(true);

    // 1. Verify Resolution Proof in DB
    const updatedDb = await Complaint.findById(complaint._id);
    expect(updatedDb.resolutionProof.length).toBeGreaterThan(0);

    // 2. Verify Timeline Entry
    const timelineEntry = updatedDb.timeline.find(t => t.title === "Resolution Proof Uploaded" || t.type === "COMPLAINT_UPDATED" || t.type === "STATUS_UPDATED" || t.type === "IMAGES_UPLOADED");
    expect(timelineEntry).toBeDefined();
  });
});
