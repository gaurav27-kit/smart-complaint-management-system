/**
 * @file uploadLimiter.test.js
 * @description API Test suite for upload rate limiting on POST /api/complaints (B-3).
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import { createTestUser, generateTestToken } from "../helpers/authHelper.js";

describe("Upload Rate Limiter (B-3)", () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await createTestUser({
      fullName: "Rate Limit User",
      email: `ratelimit.${Date.now()}.${Math.random()}@example.com`,
      role: "user",
      emailVerified: true,
    });
    token = generateTestToken(user);
  });

  it("should allow up to 10 submissions and block the 11th with a 429 status code", async () => {
    // Send 10 requests (they may fail validation or succeed, but the limiter counts them)
    for (let i = 1; i <= 10; i++) {
      const res = await request(app)
        .post("/api/complaints")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Incomplete" }); // validation fails (400), but rateLimiter executed before multer/validation

      expect(res.status).not.toBe(429);
    }

    // 11th request MUST be blocked by uploadLimiter with 429 Too Many Requests
    const res11 = await request(app)
      .post("/api/complaints")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "11th Attempt" });

    expect(res11.status).toBe(429);
    expect(res11.body.success).toBe(false);
    expect(res11.body.message).toContain("Too many file upload submissions");
  });
});
