/**
 * @file departmentAnalytics.test.js
 * @description API Test suite for Department dashboard metrics (/api/dashboard/departments).
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import Department from "../../src/models/Department.js";
import { createTestUser, generateTestToken, createTestDepartment, createTestComplaint } from "../helpers/authHelper.js";

describe("Department Analytics API", () => {
  let adminUser;
  let adminToken;
  let citizenUser;

  let deptRoad;
  let deptWater;
  let deptGarbage;
  let deptElectricity;
  let deptIT;
  let deptHealth;
  let deptSafety;

  beforeEach(async () => {
    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });
    citizenUser = await createTestUser({ role: "user" });

    // Create the standard departments
    deptRoad = await createTestDepartment({ name: "Road Department", code: "ROAD" });
    deptWater = await createTestDepartment({ name: "Water Department", code: "WATER" });
    deptGarbage = await createTestDepartment({ name: "Garbage Department", code: "GARBAGE" });
    deptElectricity = await createTestDepartment({ name: "Electricity Department", code: "ELECTRICITY" });
    deptIT = await createTestDepartment({ name: "IT Department", code: "IT" });
    deptHealth = await createTestDepartment({ name: "Health Department", code: "HEALTH" });
    deptSafety = await createTestDepartment({ name: "Safety Department", code: "SAFETY" });
  });

  it("should aggregate correct complaint counts per department (200 OK)", async () => {
    // Road Department: 2 complaints (1 Pending, 1 Resolved)
    await createTestComplaint({
      title: "Pothole",
      category: "Road",
      department: deptRoad._id,
      status: "Pending",
      createdBy: citizenUser._id,
    });
    await createTestComplaint({
      title: "Broken Divider",
      category: "Road",
      department: deptRoad._id,
      status: "Resolved",
      createdBy: citizenUser._id,
    });

    // Water Department: 1 complaint (In Progress)
    await createTestComplaint({
      title: "Water Leak",
      category: "Water",
      department: deptWater._id,
      status: "In Progress",
      createdBy: citizenUser._id,
    });

    // Garbage Department: 3 complaints (All Pending)
    for (let i = 0; i < 3; i++) {
      await createTestComplaint({
        title: `Garbage Heap ${i}`,
        category: "Garbage",
        department: deptGarbage._id,
        status: "Pending",
        createdBy: citizenUser._id,
      });
    }

    const res = await request(app)
      .get("/api/dashboard/departments")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.departments).toBeDefined();

    // Verify Road Department Metrics
    const roadStats = res.body.departments.find((d) => d.departmentName === "Road Department");
    expect(roadStats).toBeDefined();
    expect(roadStats.totalComplaints).toBe(2);
    expect(roadStats.pending).toBe(1);
    expect(roadStats.resolved).toBe(1);
    expect(roadStats.inProgress).toBe(0);

    // Verify Water Department Metrics
    const waterStats = res.body.departments.find((d) => d.departmentName === "Water Department");
    expect(waterStats).toBeDefined();
    expect(waterStats.totalComplaints).toBe(1);
    expect(waterStats.inProgress).toBe(1);
    expect(waterStats.pending).toBe(0);

    // Verify Garbage Department Metrics
    const garbageStats = res.body.departments.find((d) => d.departmentName === "Garbage Department");
    expect(garbageStats).toBeDefined();
    expect(garbageStats.totalComplaints).toBe(3);
    expect(garbageStats.pending).toBe(3);

    // Verify other departments return 0 counts
    const itStats = res.body.departments.find((d) => d.departmentName === "IT Department");
    expect(itStats).toBeDefined();
    expect(itStats.totalComplaints).toBe(0);
  });
});
