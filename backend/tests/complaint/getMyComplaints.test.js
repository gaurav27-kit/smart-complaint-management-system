/**
 * @file getMyComplaints.test.js
 * @description API Test suite for GET /api/complaints endpoint with pagination.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import { createTestUser, createTestComplaint, generateTestToken } from "../helpers/authHelper.js";

describe("GET /api/complaints (getMyComplaints with pagination)", () => {
  let user;
  let token;

  beforeEach(async () => {
    user = await createTestUser({ role: "user" });
    token = generateTestToken({ id: user._id, role: "user" });

    // Create 7 test complaints for this user
    for (let i = 1; i <= 7; i++) {
      await createTestComplaint({
        title: `Complaint ${i}`,
        createdBy: user._id,
      });
    }
  });

  it("should return paginated complaints with default limit 20 and metadata", async () => {
    const res = await request(app)
      .get("/api/complaints")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.complaints).toHaveLength(7);
    expect(res.body.count).toBe(7);
    expect(res.body.total).toBe(7);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
    expect(res.body.totalPages).toBe(1);
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 7,
      totalPages: 1,
    });
  });

  it("should support page and limit query parameters", async () => {
    const res = await request(app)
      .get("/api/complaints?page=2&limit=3")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.complaints).toHaveLength(3);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(3);
    expect(res.body.total).toBe(7);
    expect(res.body.totalPages).toBe(3);
  });

  it("should cap limit to 50 when higher limit is requested", async () => {
    const res = await request(app)
      .get("/api/complaints?limit=100")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(50);
  });
});
