/**
 * @file aiController.test.js
 * @description API Test suite for AI analyze complaint route, input validation, and rate limiting.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import { createTestUser, generateTestToken } from "../helpers/authHelper.js";

describe("POST /api/ai/analyze-complaint", () => {
  let userToken;
  let testUser;

  beforeEach(async () => {
    testUser = await createTestUser({ role: "user" });
    userToken = generateTestToken({ id: testUser._id, role: testUser.role });
  });

  it("should reject when title or description is missing (400 Bad Request)", async () => {
    const res = await request(app)
      .post("/api/ai/analyze-complaint")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "Broken pipe" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject when title or description is not a string (400 Bad Request)", async () => {
    const res = await request(app)
      .post("/api/ai/analyze-complaint")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: 12345, description: { text: "pipe leak" } });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("non-empty strings");
  });

  it("should reject when title or description is only whitespace (400 Bad Request)", async () => {
    const res = await request(app)
      .post("/api/ai/analyze-complaint")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "   ", description: "   " });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject when description exceeds 2000 characters (400 Bad Request)", async () => {
    const res = await request(app)
      .post("/api/ai/analyze-complaint")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        title: "Valid title",
        description: "a".repeat(2001),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("cannot exceed");
  });

  it("should reject when title exceeds 200 characters (400 Bad Request)", async () => {
    const res = await request(app)
      .post("/api/ai/analyze-complaint")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        title: "a".repeat(201),
        description: "Valid description",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("cannot exceed");
  });
});
