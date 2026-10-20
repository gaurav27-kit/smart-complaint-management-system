/**
 * @file login.test.js
 * @description API Test suite for POST /api/auth/login endpoint.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import { createTestUser } from "../helpers/authHelper.js";
import { buildLoginPayload } from "../helpers/testDataFactory.js";

describe("POST /api/auth/login", () => {
  let testUser;
  const rawPassword = "Password123!";

  beforeEach(async () => {
    testUser = await createTestUser({
      fullName: "Jane Login",
      email: "jane.login@example.com",
      password: rawPassword,
    });
  });

  it("should successfully log in with valid credentials (200 OK)", async () => {
    const payload = buildLoginPayload({
      email: "jane.login@example.com",
      password: rawPassword,
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send(payload);

    // 1. Verify HTTP Status
    expect(response.status).toBe(200);

    // 2. Verify Response Body Schema
    expect(response.body).toBeDefined();
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toBeDefined();
    expect(typeof response.body.token).toBe("string");

    // 3. Verify User Object Returned
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe("jane.login@example.com");
    expect(response.body.user.fullName).toBe("Jane Login");
    expect(response.body.user.role).toBe("user");

    // 4. Verify Security: Password MUST NOT be returned
    expect(response.body.user.password).toBeUndefined();
  });

  it("should reject login with wrong password (400 Bad Request)", async () => {
    const payload = buildLoginPayload({
      email: "jane.login@example.com",
      password: "WrongPassword999!",
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid email or password");
    expect(response.body.token).toBeUndefined();
  });

  it("should reject login when email does not exist (400 Bad Request)", async () => {
    const payload = buildLoginPayload({
      email: "nonexistent.user@example.com",
      password: rawPassword,
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid email or password");
    expect(response.body.token).toBeUndefined();
  });

  it("should reject login when email is missing (400 Bad Request)", async () => {
    const payload = { password: rawPassword };

    const response = await request(app)
      .post("/api/auth/login")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Email and password are required");
  });

  it("should reject login when password is missing (400 Bad Request)", async () => {
    const payload = { email: "jane.login@example.com" };

    const response = await request(app)
      .post("/api/auth/login")
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Email and password are required");
  });

  it("should handle email normalization case insensitively", async () => {
    const payload = buildLoginPayload({
      email: "JANE.LOGIN@EXAMPLE.COM",
      password: rawPassword,
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe("jane.login@example.com");
  });

  it("should reject login when email is not verified (403 Forbidden)", async () => {
    await User.findByIdAndUpdate(testUser._id, { emailVerified: false });

    const payload = buildLoginPayload({
      email: "jane.login@example.com",
      password: rawPassword,
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send(payload);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Please verify your email address");
    expect(response.body.token).toBeUndefined();
  });
});

