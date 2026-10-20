/**
 * @file deleteComplaint.test.js
 * @description API Test suite for DELETE /api/complaints/:id endpoint.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import { createTestUser, createTestComplaint, generateTestToken } from "../helpers/authHelper.js";

describe("DELETE /api/complaints/:id", () => {
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

  it("should allow creator to delete their complaint (200 OK)", async () => {
    const response = await request(app)
      .delete(`/api/complaints/${complaint._id}`)
      .set("Authorization", `Bearer ${citizenToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const deletedDb = await Complaint.findById(complaint._id);
    expect(deletedDb).toBeNull();
  });

  it("should reject deletion attempt by non-owner citizen (403 Forbidden or 404 Not Found)", async () => {
    const response = await request(app)
      .delete(`/api/complaints/${complaint._id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect([403, 404]).toContain(response.status);
    expect(response.body.success).toBe(false);

    const existingDb = await Complaint.findById(complaint._id);
    expect(existingDb).not.toBeNull();
  });
});
