/**
 * @file trustProxy.test.js
 * @description Test suite for trust proxy configuration and client IP detection (B-5).
 */

import request from "supertest";
import app from "../helpers/testApp.js";

describe("Trust Proxy Configuration (B-5)", () => {
  it("should extract client IP from X-Forwarded-For header when trust proxy is enabled", async () => {
    const res = await request(app)
      .get("/")
      .set("X-Forwarded-For", "203.0.113.195, 198.51.100.1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
