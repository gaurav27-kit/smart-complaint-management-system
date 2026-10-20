/**
 * @file passwordChangedAt.test.js
 * @description Test suite for token invalidation when password is changed (passwordChangedAt).
 */

import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../helpers/testApp.js";
import User from "../../src/models/User.js";
import { createTestUser } from "../helpers/authHelper.js";

describe("JWT Invalidation via passwordChangedAt", () => {
  let user;

  beforeEach(async () => {
    user = await createTestUser({ role: "user" });
  });

  it("should reject older JWT token issued before password was changed", async () => {
    // 1. Issue token with iat in the past
    const pastIat = Math.floor(Date.now() / 1000) - 300; // 5 minutes ago
    const oldToken = jwt.sign(
      { id: user._id.toString(), role: user.role, iat: pastIat },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Verify it works before password change
    const resBefore = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${oldToken}`);
    expect(resBefore.status).toBe(200);

    // 2. Change password & update passwordChangedAt (now)
    user.passwordChangedAt = new Date();
    await user.save();

    // 3. Request with old token should now be rejected (401)
    const resAfter = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${oldToken}`);

    expect(resAfter.status).toBe(401);
    expect(resAfter.body.success).toBe(false);
    expect(resAfter.body.message).toMatch(/password was recently changed/i);
  });

  it("should accept newly issued JWT token after password change", async () => {
    // 1. Update passwordChangedAt
    const changedTime = new Date();
    user.passwordChangedAt = changedTime;
    await user.save();

    // 2. Issue new token with iat at or after changedTime
    const newIat = Math.floor(changedTime.getTime() / 1000) + 2;
    const newToken = jwt.sign(
      { id: user._id.toString(), role: user.role, iat: newIat },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 3. Request with new token should succeed (200)
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${newToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(user.email);
  });
});
