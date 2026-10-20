/**
 * @file googleLogin.test.js
 * @description API Test suite for POST /api/auth/google endpoint.
 */

import request from "supertest";
import { jest } from "@jest/globals";
import { OAuth2Client } from "google-auth-library";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import { createTestUser } from "../helpers/authHelper.js";

describe("POST /api/auth/google", () => {
  let verifyIdTokenSpy;

  beforeEach(() => {
    // Restore or create spy before each test
    verifyIdTokenSpy = jest.spyOn(OAuth2Client.prototype, "verifyIdToken");
  });

  afterEach(() => {
    verifyIdTokenSpy.mockRestore();
  });

  it("should successfully register and log in a new user with valid Google token", async () => {
    verifyIdTokenSpy.mockResolvedValue({
      getPayload: () => ({
        sub: "google-uid-001",
        email: "newgoogleuser@example.com",
        name: "Google Newbie",
        picture: "https://example.com/photo.jpg",
        email_verified: true,
      }),
    });

    const response = await request(app)
      .post("/api/auth/google")
      .send({ credential: "mock-valid-google-credential" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe("string");

    // Check user data returned
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe("newgoogleuser@example.com");
    expect(response.body.user.fullName).toBe("Google Newbie");
    expect(response.body.user.role).toBe("user");
    expect(response.body.user.emailVerified).toBe(true);
    expect(response.body.user.authProvider).toBe("google");
    expect(response.body.user.avatar).toBe("https://example.com/photo.jpg");

    // Verify in database
    const dbUser = await User.findOne({ googleId: "google-uid-001" });
    expect(dbUser).not.toBeNull();
    expect(dbUser.email).toBe("newgoogleuser@example.com");
    expect(dbUser.password).toBeUndefined();
  });

  it("should successfully log in an existing user with matched googleId", async () => {
    const existingGoogleUser = await User.create({
      fullName: "Existing Google Member",
      email: "existing.google@example.com",
      googleId: "google-uid-002",
      authProvider: "google",
      emailVerified: true,
      role: "user",
    });

    verifyIdTokenSpy.mockResolvedValue({
      getPayload: () => ({
        sub: "google-uid-002",
        email: "existing.google@example.com",
        name: "Existing Google Member",
        picture: "https://example.com/existing.jpg",
        email_verified: true,
      }),
    });

    const response = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "mock-valid-google-idtoken" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.id).toBe(existingGoogleUser._id.toString());
    expect(response.body.token).toBeDefined();
  });

  it("should link Google account to existing local user with matching email and auto-verify", async () => {
    const localUser = await createTestUser({
      fullName: "Local User",
      email: "local.user@example.com",
      password: "Password123!",
    });
    // Set emailVerified to false to test auto-verification
    await User.findByIdAndUpdate(localUser._id, { emailVerified: false });

    verifyIdTokenSpy.mockResolvedValue({
      getPayload: () => ({
        sub: "google-uid-003",
        email: "local.user@example.com",
        name: "Local User Google",
        picture: "https://example.com/local-pic.jpg",
        email_verified: true,
      }),
    });

    const response = await request(app)
      .post("/api/auth/google")
      .send({ credential: "mock-link-credential" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.id).toBe(localUser._id.toString());
    expect(response.body.user.emailVerified).toBe(true);

    const updatedUser = await User.findById(localUser._id);
    expect(updatedUser.googleId).toBe("google-uid-003");
    expect(updatedUser.emailVerified).toBe(true);
    expect(updatedUser.avatar).toBe("https://example.com/local-pic.jpg");
  });

  it("should reject request when neither idToken nor credential is provided (400 Bad Request)", async () => {
    const response = await request(app)
      .post("/api/auth/google")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Google ID token or credential is required");
  });

  it("should reject request with invalid or expired Google token (401 Unauthorized)", async () => {
    verifyIdTokenSpy.mockRejectedValue(new Error("Token used too late"));

    const response = await request(app)
      .post("/api/auth/google")
      .send({ credential: "expired-token" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid or expired Google token");
  });

  it("should reject request when Google email is not verified (400 Bad Request)", async () => {
    verifyIdTokenSpy.mockResolvedValue({
      getPayload: () => ({
        sub: "google-uid-unverified",
        email: "unverified@example.com",
        name: "Unverified User",
        email_verified: false,
      }),
    });

    const response = await request(app)
      .post("/api/auth/google")
      .send({ credential: "mock-unverified-credential" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Google account email is not verified");
  });

  it("should reject request when user account is deactivated (403 Forbidden)", async () => {
    await User.create({
      fullName: "Deactivated User",
      email: "deactivated@example.com",
      googleId: "google-uid-deactivated",
      authProvider: "google",
      isActive: false,
      emailVerified: true,
      role: "user",
    });

    verifyIdTokenSpy.mockResolvedValue({
      getPayload: () => ({
        sub: "google-uid-deactivated",
        email: "deactivated@example.com",
        name: "Deactivated User",
        email_verified: true,
      }),
    });

    const response = await request(app)
      .post("/api/auth/google")
      .send({ credential: "mock-deactivated-credential" });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("account has been deactivated");
  });
});
