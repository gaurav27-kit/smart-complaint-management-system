/**
 * @file citizenDashboard.test.js
 * @description API Test suite for Citizen Dashboard complaints endpoints (/api/complaints).
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import { createTestUser, generateTestToken, createTestComplaint } from "../helpers/authHelper.js";

describe("Citizen Dashboard API", () => {
  let citizenA;
  let tokenA;
  let citizenB;
  let tokenB;

  beforeEach(async () => {
    citizenA = await createTestUser({ role: "user" });
    tokenA = generateTestToken({ id: citizenA._id, role: "user" });

    citizenB = await createTestUser({ role: "user" });
    tokenB = generateTestToken({ id: citizenB._id, role: "user" });
  });

  it("should fetch complaints created by the logged-in citizen only", async () => {
    // Citizen A complaints
    await createTestComplaint({ title: "Citizen A Complaint 1", createdBy: citizenA._id, status: "Pending" });
    await createTestComplaint({ title: "Citizen A Complaint 2", createdBy: citizenA._id, status: "Resolved" });

    // Citizen B complaints
    await createTestComplaint({ title: "Citizen B Complaint 1", createdBy: citizenB._id, status: "In Progress" });

    // Fetch complaints as Citizen A
    const resA = await request(app)
      .get("/api/complaints")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(resA.status).toBe(200);
    expect(resA.body.success).toBe(true);
    expect(resA.body.count).toBe(2);
    expect(resA.body.complaints).toHaveLength(2);
    expect(resA.body.complaints[0].createdBy.toString()).toBe(citizenA._id.toString());
    expect(resA.body.complaints[1].createdBy.toString()).toBe(citizenA._id.toString());

    // Fetch complaints as Citizen B
    const resB = await request(app)
      .get("/api/complaints")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    expect(resB.body.success).toBe(true);
    expect(resB.body.count).toBe(1);
    expect(resB.body.complaints[0].title).toBe("Citizen B Complaint 1");
    expect(resB.body.complaints[0].createdBy.toString()).toBe(citizenB._id.toString());
  });

  it("should return correct empty response when citizen has no complaints", async () => {
    const res = await request(app)
      .get("/api/complaints")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(0);
    expect(res.body.complaints).toEqual([]);
  });

  it("should deny access if authorization token is missing (401 Unauthorized)", async () => {
    const res = await request(app).get("/api/complaints");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
