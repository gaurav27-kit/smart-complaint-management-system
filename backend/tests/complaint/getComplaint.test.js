/**
 * @file getComplaint.test.js
 * @description API Test suite for GET /api/complaints/:id endpoint.
 */

import request from "supertest";
import mongoose from "mongoose";
import app from "../helpers/testApp.js";
import { createTestUser, createTestComplaint, generateTestToken } from "../helpers/authHelper.js";

describe("GET /api/complaints/:id", () => {
  let citizenUser;
  let citizenToken;
  let complaint;

  beforeEach(async () => {
    citizenUser = await createTestUser({ role: "user" });
    citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });
    complaint = await createTestComplaint({ createdBy: citizenUser._id });
  });

  it("should successfully retrieve complaint details by valid ID (200 OK)", async () => {
    const response = await request(app)
      .get(`/api/complaints/${complaint._id}`)
      .set("Authorization", `Bearer ${citizenToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.complaint).toBeDefined();
    expect(response.body.complaint._id.toString()).toBe(complaint._id.toString());
    expect(response.body.complaint.title).toBe("Test Complaint Title");
  });

  it("should return 404 for a non-existent complaint ID", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/complaints/${nonExistentId}`)
      .set("Authorization", `Bearer ${citizenToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Complaint not found");
  });

  it("should return 400 for an invalid ObjectId format", async () => {
    const response = await request(app)
      .get("/api/complaints/invalid_mongo_id_format")
      .set("Authorization", `Bearer ${citizenToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message.toLowerCase()).toContain("invalid complaint id format");
  });
});
