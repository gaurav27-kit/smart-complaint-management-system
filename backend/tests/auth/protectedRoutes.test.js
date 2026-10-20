/**
 * @file protectedRoutes.test.js
 * @description API Test suite for Protected Routes & Auth Middleware (GET /api/profile).
 */

import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../helpers/testApp.js";
import { createTestUser, generateTestToken } from "../helpers/authHelper.js";

describe("Protected Routes & Auth Middleware (GET /api/profile)", () => {
  let testUser;
  let validToken;

  beforeEach(async () => {
    testUser = await createTestUser({
      fullName: "Protected User",
      email: "protected.user@example.com",
    });
    validToken = generateTestToken({ id: testUser._id, role: testUser.role });
  });

  it("should allow access to protected route with valid JWT (200 OK)", async () => {
    const response = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${validToken}`);

    // 1. Verify HTTP Status & Response Body
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("Protected route accessed successfully");

    // 2. Verify Decoded User Payload in Request
    expect(response.body.user).toBeDefined();
    expect(response.body.user.id).toBe(testUser._id.toString());
    expect(response.body.user.role).toBe("user");
  });

  it("should reject request when JWT is missing (401 Unauthorized)", async () => {
    const response = await request(app)
      .get("/api/profile");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Access denied. No token provided.");
  });

  it("should reject request when JWT is invalid/malformed (401 Unauthorized)", async () => {
    const response = await request(app)
      .get("/api/profile")
      .set("Authorization", "Bearer invalid_token_string_12345");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid or expired token");
  });

  it("should reject request when JWT is expired (401 Unauthorized)", async () => {
    const expiredToken = jwt.sign(
      { id: testUser._id, role: testUser.role },
      process.env.JWT_SECRET || "test_jwt_secret_key_scms_2026_super_secret",
      { expiresIn: "-1s" } // Already expired
    );

    const response = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid or expired token");
  });

  it("should reject request when JWT signature is tampered (401 Unauthorized)", async () => {
    const tamperedToken = jwt.sign(
      { id: testUser._id, role: "admin" }, // Modified payload with fake secret
      "wrong_tampered_secret_key"
    );

    const response = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${tamperedToken}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid or expired token");
  });
});
