/**
 * @file register.test.js
 * @description API Test suite for POST /api/auth/register endpoint.
 *
 * Verifies full request lifecycle through Express route -> middleware -> authController -> Mongoose User model -> MongoMemoryServer.
 */

import request from "supertest";
import bcrypt from "bcryptjs";
import { jest } from "@jest/globals";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import { buildRegisterPayload } from "../helpers/testDataFactory.js";
import { notificationService } from "../../src/notifications/services/NotificationService.js";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.spyOn(notificationService, "sendEmailVerification").mockImplementation(() => Promise.resolve());
  });
  describe("Successful Registration", () => {
    it("should register a new user successfully with valid payload (201 Created)", async () => {
      const payload = buildRegisterPayload({
        fullName: "John Doe",
        email: "john.doe@example.com",
        password: "Password123!",
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send(payload);

      // 1. Verify HTTP status code
      expect(response.status).toBe(201);

      // 2. Verify response body structure
      expect(response.body).toBeDefined();
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Account created");
      expect(response.body.user).toBeDefined();
      expect(response.body.user.fullName).toBe("John Doe");
      expect(response.body.user.email).toBe("john.doe@example.com");
      expect(response.body.user.role).toBe("user");
      expect(response.body.user.emailVerified).toBe(false);

      // 3. Verify security: Password must NEVER be returned in response
      expect(response.body.user.password).toBeUndefined();

      // 4. Verify Database Persistence in MongoMemoryServer
      const dbUser = await User.findOne({ email: "john.doe@example.com" }).select("+password");
      expect(dbUser).not.toBeNull();
      expect(dbUser.fullName).toBe("John Doe");

      // 5. Verify Password Hashing integrity
      expect(dbUser.password).not.toBe("Password123!");
      const isPasswordHashed = await bcrypt.compare("Password123!", dbUser.password);
      expect(isPasswordHashed).toBe(true);
    });
  });

  describe("Duplicate Registration Prevention", () => {
    it("should reject registration when email already exists (409 Conflict)", async () => {
      const payload = buildRegisterPayload({ email: "existing.user@example.com" });

      // First registration (creates initial user)
      const firstResponse = await request(app)
        .post("/api/auth/register")
        .send(payload);
      expect(firstResponse.status).toBe(201);

      // Second registration with same email (case-insensitive)
      const duplicatePayload = buildRegisterPayload({ email: "EXISTING.USER@example.com" });
      const response = await request(app)
        .post("/api/auth/register")
        .send(duplicatePayload);

      // Verify HTTP 409 Conflict status and response format
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("account with this email already exists");
    });
  });

  describe("Payload Validation & Edge Cases", () => {
    it("should fail when fullName is missing or empty (400 Bad Request)", async () => {
      const payload = buildRegisterPayload({ fullName: "   " });

      const response = await request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("All fields are required");
    });

    it("should fail when email is missing (400 Bad Request)", async () => {
      const payload = buildRegisterPayload();
      delete payload.email;

      const response = await request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("All fields are required");
    });

    it("should fail when password is missing (400 Bad Request)", async () => {
      const payload = buildRegisterPayload();
      delete payload.password;

      const response = await request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("All fields are required");
    });

    it("should fail when password is less than 6 characters (400 Bad Request)", async () => {
      const payload = buildRegisterPayload({ password: "12345" });

      const response = await request(app)
        .post("/api/auth/register")
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Password must be at least 6 characters");
    });
  });
});
