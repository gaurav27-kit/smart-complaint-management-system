/**
 * @file updateComplaint.test.js
 * @description API Test suite for PATCH /api/complaints/:id endpoint.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import { createTestUser, createTestComplaint, generateTestToken } from "../helpers/authHelper.js";

describe("PATCH /api/complaints/:id", () => {
  let citizenUser;
  let citizenToken;
  let otherUser;
  let otherToken;
  let complaint;

  beforeEach(async () => {
    citizenUser = await createTestUser({ role: "user" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });

    otherUser = await createTestUser({ role: "user" });
    otherToken = generateTestToken({ id: otherUser._id, role: "user" });

    complaint = await createTestComplaint({ createdBy: citizenUser._id });
  });

  it("should allow creator to update complaint fields (200 OK)", async () => {
    const response = await request(app)
      .patch(`/api/complaints/${complaint._id}`)
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({
        title: "Updated Title for Complaint",
        priority: "High",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.complaint.title).toBe("Updated Title for Complaint");

    const updatedDb = await Complaint.findById(complaint._id);
    expect(updatedDb.title).toBe("Updated Title for Complaint");
    expect(updatedDb.priority).toBe("High");
  });

  it("should reject update attempt by another citizen (403 Forbidden or 404 Not Found)", async () => {
    const response = await request(app)
      .patch(`/api/complaints/${complaint._id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({
        title: "Unauthorized Edit Attempt",
      });

    expect([403, 404]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });
});
