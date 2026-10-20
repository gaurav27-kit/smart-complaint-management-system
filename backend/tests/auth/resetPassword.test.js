/**
 * @file resetPassword.test.js
 * @description API Test suite for POST /api/auth/reset-password/:token endpoint.
 */

import request from "supertest";
import bcrypt from "bcryptjs";
import { jest } from "@jest/globals";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import { createTestUser } from "../helpers/authHelper.js";
import { generatePasswordResetToken } from "../../src/utils/tokenUtils.js";
import { notificationService } from "../../src/notifications/services/NotificationService.js";

describe("POST /api/auth/reset-password/:token", () => {
  beforeEach(() => {
    jest.spyOn(notificationService, "sendPasswordResetSuccess").mockImplementation(() => Promise.resolve());
  });

  it("should successfully reset password with valid token and payload (200 OK)", async () => {
    const oldPassword = "OldPassword123!";
    const newPassword = "NewPassword456!";

    const { rawToken, hashedToken, expiresAt } = generatePasswordResetToken();

    const user = await createTestUser({
      email: "reset.user@example.com",
      password: oldPassword,
      passwordResetToken: hashedToken,
      passwordResetExpires: expiresAt,
    });

    const response = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({
        password: newPassword,
        confirmPassword: newPassword,
      });

    // 1. Verify Response Status & Body
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("Password reset successfully");

    // 2. Verify Database Hashing & Token Invalidation
    const updatedUser = await User.findById(user._id).select("+password +passwordResetToken +passwordResetExpires");
    expect(updatedUser.passwordResetToken).toBeUndefined();
    expect(updatedUser.passwordResetExpires).toBeUndefined();

    // Verify bcrypt hashing of new password in database
    const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
    expect(isNewPasswordValid).toBe(true);

    // 3. Verify Old Password No Longer Works for Login
    const oldLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "reset.user@example.com", password: oldPassword });
    expect(oldLoginResponse.status).toBe(400);

    // 4. Verify New Password Successfully Logs In
    const newLoginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "reset.user@example.com", password: newPassword });
    expect(newLoginResponse.status).toBe(200);
    expect(newLoginResponse.body.success).toBe(true);
  });

  it("should reject password reset when password and confirmation mismatch (400 Bad Request)", async () => {
    const { rawToken, hashedToken, expiresAt } = generatePasswordResetToken();

    await createTestUser({
      email: "mismatch@example.com",
      passwordResetToken: hashedToken,
      passwordResetExpires: expiresAt,
    });

    const response = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({
        password: "NewPassword123!",
        confirmPassword: "DifferentPassword123!",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Passwords do not match");
  });

  it("should reject password reset with an invalid token (400 Bad Request)", async () => {
    const response = await request(app)
      .post("/api/auth/reset-password/invalid_reset_token")
      .send({
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid or expired reset link");
  });

  it("should reject password reset with an expired token (400 Bad Request)", async () => {
    const { rawToken, hashedToken } = generatePasswordResetToken();
    const expiredDate = new Date(Date.now() - 3600000); // 1 hour ago

    await createTestUser({
      email: "expiredreset@example.com",
      passwordResetToken: hashedToken,
      passwordResetExpires: expiredDate,
    });

    const response = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid or expired reset link");
  });
});
