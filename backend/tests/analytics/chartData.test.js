/**
 * @file chartData.test.js
 * @description API Test suite for validating chart datasets (Pie, Bar, Line, Trend charts).
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import Department from "../../src/models/Department.js";
import { createTestUser, generateTestToken, createTestDepartment, createTestComplaint } from "../helpers/authHelper.js";

describe("Chart Dataset Format Verification", () => {
  let adminUser;
  let adminToken;
  let citizenUser;
  let dept;

  beforeEach(async () => {
    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });
    citizenUser = await createTestUser({ role: "user" });

    dept = await createTestDepartment({ name: "Chart Department", code: "CHART" });
  });

  it("should format Bar chart dataset correctly (department-wise statuses) (200 OK)", async () => {
    await createTestComplaint({
      title: "Broken pipe",
      category: "Water",
      department: dept._id,
      status: "In Progress",
      createdBy: citizenUser._id,
    });

    const res = await request(app)
      .get("/api/dashboard/departments")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.departments).toBeDefined();
    expect(res.body.departments).toBeInstanceOf(Array);

    const deptData = res.body.departments.find((d) => d.departmentName === "Chart Department");
    expect(deptData).toBeDefined();
    // Validate schema expected by frontend Bar chart
    expect(deptData).toHaveProperty("departmentId");
    expect(deptData).toHaveProperty("departmentName");
    expect(deptData).toHaveProperty("totalComplaints");
    expect(deptData).toHaveProperty("pending");
    expect(deptData).toHaveProperty("inProgress");
    expect(deptData).toHaveProperty("resolved");
    expect(deptData).toHaveProperty("closed");

    expect(deptData.totalComplaints).toBe(1);
    expect(deptData.inProgress).toBe(1);
  });

  it("should format Pie chart dataset correctly (category-wise distribution) (200 OK)", async () => {
    await createTestComplaint({ category: "Road", createdBy: citizenUser._id });
    await createTestComplaint({ category: "Water", createdBy: citizenUser._id });

    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const { categoryWise } = res.body.analytics;
    expect(categoryWise).toBeInstanceOf(Array);
    
    // Check schema for Pie Chart items: { _id: String, count: Number }
    categoryWise.forEach((item) => {
      expect(item).toHaveProperty("_id"); // category name
      expect(item).toHaveProperty("count");
      expect(typeof item._id).toBe("string");
      expect(typeof item.count).toBe("number");
    });
  });

  it("should format Line and Trend chart dataset correctly (monthly trends) (200 OK)", async () => {
    const now = new Date();
    await createTestComplaint({ createdBy: citizenUser._id, createdAt: now });

    // Endpoint 1: dashboard monthly trends
    const resMonthly = await request(app)
      .get("/api/dashboard/monthly")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(resMonthly.status).toBe(200);
    expect(resMonthly.body.monthly).toBeInstanceOf(Array);
    if (resMonthly.body.monthly.length > 0) {
      const trendItem = resMonthly.body.monthly[0];
      expect(trendItem).toHaveProperty("month"); // "YYYY-MM" format
      expect(trendItem).toHaveProperty("count");
      expect(trendItem.month).toMatch(/^\d{4}-\d{2}$/);
      expect(typeof trendItem.count).toBe("number");
    }

    // Endpoint 2: admin analytics monthly trend
    const resAnalytics = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(resAnalytics.status).toBe(200);
    const { monthlyTrend } = resAnalytics.body.analytics;
    expect(monthlyTrend).toBeInstanceOf(Array);
    if (monthlyTrend.length > 0) {
      const trendItem = monthlyTrend[0];
      expect(trendItem).toHaveProperty("_id");
      expect(trendItem._id).toHaveProperty("year");
      expect(trendItem._id).toHaveProperty("month");
      expect(trendItem).toHaveProperty("count");
    }
  });
});
