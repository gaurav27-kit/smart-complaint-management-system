/**
 * @file jwtAuthorization.test.js
 * @description API Test suite for Module 6: JWT Authorization & Header Validation.
 * Tests edge cases for missing, invalid, expired, tampered, and malformed JWT authorization headers.
 */

import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import {
  createTestUser,
  generateTestToken,
  createTestDepartmentMember,
} from "../helpers/authHelper.js";

describe("Module 6: JWT Authorization & Header Validation", () => {
  let validToken;
  let testUser;

  beforeEach(async () => {
    testUser = await createTestUser({ role: "user" });
    validToken = generateTestToken({ id: testUser._id, role: testUser.role });
  });

  describe("Header Parsing & Authentication", () => {
    it("should allow request with valid JWT and Bearer prefix (200 OK)", async () => {
      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const userId = response.body.user.id || response.body.user._id;
      expect(userId.toString()).toBe(testUser._id.toString());
    });

    it("should reject request when Authorization header is completely missing (401 Unauthorized)", async () => {
      const response = await request(app).get("/api/profile");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("No token provided");
    });

    it("should reject request when Authorization header does not use Bearer scheme (401 Unauthorized)", async () => {
      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Basic ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("No token provided");
    });

    it("should reject request when Authorization header has missing space after Bearer (401 Unauthorized)", async () => {
      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject request with malformed / invalid JWT string (401 Unauthorized)", async () => {
      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", "Bearer invalid_malformed_jwt_token_12345");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid or expired token");
    });

    it("should reject request with expired JWT token (401 Unauthorized)", async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id, role: testUser.role },
        process.env.JWT_SECRET || "test-jwt-secret-key-12345",
        { expiresIn: "-1s" }
      );

      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid or expired token");
    });

    it("should reject request with tampered JWT signature (401 Unauthorized)", async () => {
      const tamperedToken = validToken.slice(0, -5) + "abcde";

      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid or expired token");
    });

    it("should reject request when JWT secret is signed with wrong secret (401 Unauthorized)", async () => {
      const wrongSecretToken = jwt.sign(
        { id: testUser._id, role: testUser.role },
        "completely_wrong_secret_key_99999",
        { expiresIn: "1h" }
      );

      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${wrongSecretToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject request immediately when user account is deactivated (401 Unauthorized)", async () => {
      await User.findByIdAndUpdate(testUser._id, { isActive: false });

      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("inactive or no longer exists");
    });

    it("should reject request immediately when department member is deactivated (401 Unauthorized)", async () => {
      const deptMemberUser = await createTestUser({ role: "department_member" });
      const memberRecord = await createTestDepartmentMember({
        user: deptMemberUser,
        isActive: true,
      });

      const memberToken = generateTestToken({
        id: deptMemberUser._id,
        role: "department_member",
      });

      // Verify active works
      const activeRes = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${memberToken}`);
      expect(activeRes.status).toBe(200);

      // Deactivate department member
      await DepartmentMember.findByIdAndUpdate(memberRecord._id, { isActive: false });

      // Immediate rejection
      const inactiveRes = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(inactiveRes.status).toBe(401);
      expect(inactiveRes.body.success).toBe(false);
      expect(inactiveRes.body.message).toContain("deactivated");
    });

    it("should reject request when user no longer exists in database (401 Unauthorized)", async () => {
      const nonExistentToken = generateTestToken({
        id: new mongoose.Types.ObjectId(),
        role: "user",
      });

      const response = await request(app)
        .get("/api/profile")
        .set("Authorization", `Bearer ${nonExistentToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

