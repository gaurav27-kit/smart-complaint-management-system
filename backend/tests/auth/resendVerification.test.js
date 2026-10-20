/**
 * @file resendVerification.test.js
 * @description API Test suite for POST /api/auth/resend-verification endpoint.
 */

import request from "supertest";
import { jest } from "@jest/globals";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import { createTestUser } from "../helpers/authHelper.js";
import { generateEmailVerificationToken } from "../../src/utils/tokenUtils.js";
import { notificationService } from "../../src/notifications/services/NotificationService.js";

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => {
    jest.spyOn(notificationService, "sendEmailVerification").mockImplementation(() => Promise.resolve());
  });

  it("should generate a new verification token and send email for unverified user (200 OK)", async () => {
    const { hashedToken, expiresAt } = generateEmailVerificationToken();

    const user = await createTestUser({
      email: "resend.unverified@example.com",
      emailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expiresAt,
    });

    const response = await request(app)
      .post("/api/auth/resend-verification")
      .send({ email: "resend.unverified@example.com" });

    // 1. Verify Response Status & Body
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("If an unverified account exists");

    // 2. Verify Token Update in DB
    const updatedUser = await User.findById(user._id).select("+emailVerificationToken +emailVerificationExpires");
    expect(updatedUser.emailVerificationToken).toBeDefined();
    expect(updatedUser.emailVerificationToken).not.toBe(hashedToken); // Token refreshed
  });

  it("should return success response for already verified user without sending email (200 OK)", async () => {
    await createTestUser({
      email: "already.verified@example.com",
      emailVerified: true,
    });

    const response = await request(app)
      .post("/api/auth/resend-verification")
      .send({ email: "already.verified@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("If an unverified account exists");
  });

  it("should return success response for unknown email (200 OK)", async () => {
    const response = await request(app)
      .post("/api/auth/resend-verification")
      .send({ email: "unknown.resend@example.com" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("If an unverified account exists");
  });

  it("should reject resend request when email is missing (400 Bad Request)", async () => {
    const response = await request(app)
      .post("/api/auth/resend-verification")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Email is required");
  });
});
