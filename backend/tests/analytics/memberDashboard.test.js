/**
 * @file memberDashboard.test.js
 * @description API Test suite for Department Member Dashboard (/api/member/dashboard).
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import Department from "../../src/models/Department.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import {
  createTestUser,
  generateTestToken,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint
} from "../helpers/authHelper.js";

describe("Department Member Dashboard API", () => {
  let adminUser;
  let adminToken;
  let citizenUser;
  
  let deptWater;
  let deptRoad;

  let headUser;
  let headMember;
  let headToken;

  let officerUser;
  let officerMember;
  let officerToken;

  beforeEach(async () => {
    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });

    citizenUser = await createTestUser({ role: "user" });

    // Create Departments
    deptWater = await createTestDepartment({ name: "Water Department", code: "WATER" });
    deptRoad = await createTestDepartment({ name: "Road Department", code: "ROAD" });

    // Create Head
    headUser = await createTestUser({ role: "department_member" });
    headMember = await createTestDepartmentMember({
      user: headUser._id,
      department: deptWater._id,
      deptRole: "HEAD",
    });
    headToken = generateTestToken({ id: headUser._id, role: "department_member" });

    // Create Field Officer
    officerUser = await createTestUser({ role: "department_member" });
    officerMember = await createTestDepartmentMember({
      user: officerUser._id,
      department: deptWater._id,
      deptRole: "FIELD_OFFICER",
    });
    officerToken = generateTestToken({ id: officerUser._id, role: "department_member" });
  });

  it("should return empty metrics when no complaints exist in the department (200 OK)", async () => {
    const res = await request(app)
      .get("/api/member/dashboard")
      .set("Authorization", `Bearer ${headToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deptRole).toBe("HEAD");
    expect(res.body.data.totalComplaints).toBe(0);
  });

  it("should show all department complaints to the HEAD of department (200 OK)", async () => {
    // 2 complaints in Water Department (1 assigned to officer, 1 unassigned)
    await createTestComplaint({
      title: "Water leak 1",
      category: "Water",
      department: deptWater._id,
      assignedMember: officerMember._id,
      status: "In Progress",
      createdBy: citizenUser._id,
    });

    await createTestComplaint({
      title: "Water leak 2",
      category: "Water",
      department: deptWater._id,
      status: "Pending",
      createdBy: citizenUser._id,
    });

    // 1 complaint in Road Department
    await createTestComplaint({
      title: "Road pothole",
      category: "Road",
      department: deptRoad._id,
      status: "Pending",
      createdBy: citizenUser._id,
    });

    const res = await request(app)
      .get("/api/member/dashboard")
      .set("Authorization", `Bearer ${headToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deptRole).toBe("HEAD");
    expect(res.body.data.totalComplaints).toBe(2);
    expect(res.body.data.inProgress).toBe(1);
    expect(res.body.data.pending).toBe(1);
  });

  it("should show only assigned complaints to a FIELD_OFFICER (200 OK)", async () => {
    // 2 complaints in Water Department (1 assigned to officer, 1 unassigned)
    const c1 = await createTestComplaint({
      title: "Water leak 1",
      category: "Water",
      department: deptWater._id,
      assignedMember: officerMember._id,
      status: "In Progress",
      createdBy: citizenUser._id,
    });

    await createTestComplaint({
      title: "Water leak 2",
      category: "Water",
      department: deptWater._id,
      status: "Pending",
      createdBy: citizenUser._id,
    });

    const res = await request(app)
      .get("/api/member/dashboard")
      .set("Authorization", `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deptRole).toBe("FIELD_OFFICER");
    expect(res.body.data.totalComplaints).toBe(1);
    expect(res.body.data.inProgress).toBe(1);
    expect(res.body.data.pending).toBe(0);
  });

  it("should return empty metrics for a user who is not a department member (200 OK)", async () => {
    const userWithoutDept = await createTestUser({ role: "department_member" });
    const token = generateTestToken({ id: userWithoutDept._id, role: "department_member" });

    const res = await request(app)
      .get("/api/member/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalComplaints).toBe(0);
  });
});
