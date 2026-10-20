/**
 * @file analyticsCalculation.test.js
 * @description API Test suite for KPI calculations, percentages, totals, and trends (/api/admin/analytics).
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import { createTestUser, generateTestToken, createTestComplaint } from "../helpers/authHelper.js";

describe("Analytics Calculations", () => {
  let adminUser;
  let adminToken;
  let citizenUser;

  beforeEach(async () => {
    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });
    citizenUser = await createTestUser({ role: "user" });
  });

  it("should calculate correct KPIs when there are no complaints (200 OK)", async () => {
    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analytics).toBeDefined();
    expect(res.body.analytics.totalComplaints).toBe(0);
    expect(res.body.analytics.resolutionRate).toBe(0);
    expect(res.body.analytics.categoryWise).toEqual([]);
    expect(res.body.analytics.monthlyTrend).toEqual([]);
    expect(res.body.analytics.thisMonthCount).toBe(0);
  });

  it("should calculate correct KPIs and percentages when complaints exist (200 OK)", async () => {
    const now = new Date();
    // Seed complaints with varying statuses and categories
    await createTestComplaint({ status: "Resolved", category: "Road", createdBy: citizenUser._id, createdAt: now });
    await createTestComplaint({ status: "Resolved", category: "Road", createdBy: citizenUser._id, createdAt: now });
    await createTestComplaint({ status: "Pending", category: "Water", createdBy: citizenUser._id, createdAt: now });
    await createTestComplaint({ status: "In Progress", category: "Electricity", createdBy: citizenUser._id, createdAt: now });

    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { analytics } = res.body;
    expect(analytics.totalComplaints).toBe(4);
    expect(analytics.resolved).toBe(2);
    expect(analytics.pending).toBe(1);
    expect(analytics.inProgress).toBe(1);

    // Math validation: 2 resolved out of 4 total is 50.00%
    expect(analytics.resolutionRate).toBe("50.00");

    // Category distribution checks (sorted by count desc)
    expect(analytics.categoryWise).toHaveLength(3);
    expect(analytics.categoryWise[0]).toEqual({ _id: "Road", count: 2 });
    expect(analytics.categoryWise[1]).toEqual(
      expect.objectContaining({ count: 1 })
    );

    // Monthly trends check
    expect(analytics.monthlyTrend).toHaveLength(1);
    expect(analytics.monthlyTrend[0]._id.month).toBe(now.getMonth() + 1);
    expect(analytics.monthlyTrend[0]._id.year).toBe(now.getFullYear());
    expect(analytics.monthlyTrend[0].count).toBe(4);

    // This month count check
    expect(analytics.thisMonthCount).toBe(4);
  });

  it("should calculate correct resolution rate when it is 100% or non-trivial decimals", async () => {
    // 3 complaints, 1 resolved -> 1/3 = 33.33%
    await createTestComplaint({ status: "Resolved", createdBy: citizenUser._id });
    await createTestComplaint({ status: "Pending", createdBy: citizenUser._id });
    await createTestComplaint({ status: "Pending", createdBy: citizenUser._id });

    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.analytics.resolutionRate).toBe("33.33");
  });
});
