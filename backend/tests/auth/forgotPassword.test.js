/**
 * @file forgotPassword.test.js
 * @description API Test suite for POST /api/auth/forgot-password endpoint.
 */

import request from "supertest";
import { jest } from "@jest/globals";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import { createTestUser } from "../helpers/authHelper.js";
import { notificationService } from "../../src/notifications/services/NotificationService.js";

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    jest.spyOn(notificationService, "sendForgotPassword").mockImplementation(() => Promise.resolve());
  });

  it("should generate a reset token and dispatch email for an existing email (200 OK)", async () => {
    const user = await createTestUser({ email: "forgot.user@example.com" });

    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "forgot.user@example.com" });

    // 1. Verify HTTP Status & Response Body
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("password reset link has been sent");

    // 2. Verify Database Persistence of Reset Token
    const dbUser = await User.findById(user._id).select("+passwordResetToken +passwordResetExpires");
    expect(dbUser.passwordResetToken).toBeDefined();
    expect(dbUser.passwordResetExpires).toBeDefined();
    expect(new Date(dbUser.passwordResetExpires).getTime()).toBeGreaterThan(Date.now());

    // 3. Verify Notification Service Invocation
    expect(notificationService.sendForgotPassword).toHaveBeenCalledTimes(1);
  });

  it("should return success response for unknown email without creating reset token (200 OK)", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nonexistent.forgot@example.com" });

    // Security Standard: Anti-enumeration check
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("password reset link has been sent");
  });

  it("should reject forgot-password request when email is missing (400 Bad Request)", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Email is required");
  });
});
