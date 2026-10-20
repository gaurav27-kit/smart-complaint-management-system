/**
 * @file verifyEmail.test.js
 * @description API Test suite for GET /api/auth/verify-email/:token endpoint.
 */

import request from "supertest";
import { jest } from "@jest/globals";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import { createTestUser } from "../helpers/authHelper.js";
import { generateEmailVerificationToken, hashToken } from "../../src/utils/tokenUtils.js";
import { notificationService } from "../../src/notifications/services/NotificationService.js";

describe("GET /api/auth/verify-email/:token", () => {
  beforeEach(() => {
    jest.spyOn(notificationService, "sendWelcomeEmail").mockImplementation(() => Promise.resolve());
  });

  it("should successfully verify email with a valid token (200 OK)", async () => {
    const { rawToken, hashedToken, expiresAt } = generateEmailVerificationToken();

    const user = await createTestUser({
      email: "unverified@example.com",
      emailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expiresAt,
    });

    const response = await request(app)
      .get(`/api/auth/verify-email/${rawToken}`);

    // 1. Verify HTTP Status & Response Body
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("Email verified successfully");

    // 2. Verify Database State Update
    const updatedUser = await User.findById(user._id).select("+emailVerificationToken +emailVerificationExpires");
    expect(updatedUser.emailVerified).toBe(true);

    // 3. Verify Token Invalidation in DB
    expect(updatedUser.emailVerificationToken).toBeUndefined();
    expect(updatedUser.emailVerificationExpires).toBeUndefined();
  });

  it("should reject verification with an invalid token (400 Bad Request)", async () => {
    const response = await request(app)
      .get("/api/auth/verify-email/invalid_token_12345");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid or expired verification link");
  });

  it("should reject verification with an expired token (400 Bad Request)", async () => {
    const { rawToken, hashedToken } = generateEmailVerificationToken();
    const expiredDate = new Date(Date.now() - 3600000); // 1 hour in the past

    await createTestUser({
      email: "expired@example.com",
      emailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expiredDate,
    });

    const response = await request(app)
      .get(`/api/auth/verify-email/${rawToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid or expired verification link");
  });

  it("should handle already verified user account cleanly (200 OK)", async () => {
    const { rawToken, hashedToken, expiresAt } = generateEmailVerificationToken();

    await createTestUser({
      email: "alreadyverified@example.com",
      emailVerified: true,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expiresAt,
    });

    const response = await request(app)
      .get(`/api/auth/verify-email/${rawToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("already verified");
  });
});
