/**
 * @file workloadAnalytics.test.js
 * @description API Test suite for Officer Workload statistics (/api/dashboard/workload).
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import Department from "../../src/models/Department.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import User from "../../src/models/User.js";
import {
  createTestUser,
  generateTestToken,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint
} from "../helpers/authHelper.js";

describe("Workload Analytics API", () => {
  let adminUser;
  let adminToken;
  let citizenUser;

  let dept;
  let officerA;
  let officerUserA;
  let officerB;
  let officerUserB;

  beforeEach(async () => {
    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });
    citizenUser = await createTestUser({ role: "user" });

    dept = await createTestDepartment({ name: "Workload Dept", code: "WLOAD" });

    // Officer A
    officerUserA = await createTestUser({ fullName: "Officer Alpha", role: "department_member" });
    officerA = await createTestDepartmentMember({
      user: officerUserA._id,
      department: dept._id,
      deptRole: "FIELD_OFFICER",
    });

    // Officer B
    officerUserB = await createTestUser({ fullName: "Officer Beta", role: "department_member" });
    officerB = await createTestDepartmentMember({
      user: officerUserB._id,
      department: dept._id,
      deptRole: "FIELD_OFFICER",
    });
  });

  it("should return correct workload statistics for all officers (200 OK)", async () => {
    // Seed complaints
    // Officer Alpha has 3 complaints: 2 Pending, 1 In Progress
    await createTestComplaint({
      title: "C1",
      category: "Road",
      department: dept._id,
      assignedMember: officerA._id,
      status: "Pending",
      createdBy: citizenUser._id,
    });
    await createTestComplaint({
      title: "C2",
      category: "Road",
      department: dept._id,
      assignedMember: officerA._id,
      status: "Pending",
      createdBy: citizenUser._id,
    });
    await createTestComplaint({
      title: "C3",
      category: "Road",
      department: dept._id,
      assignedMember: officerA._id,
      status: "In Progress",
      createdBy: citizenUser._id,
    });

    // Officer Beta has 1 complaint: 1 Resolved
    await createTestComplaint({
      title: "C4",
      category: "Road",
      department: dept._id,
      assignedMember: officerB._id,
      status: "Resolved",
      createdBy: citizenUser._id,
    });

    const res = await request(app)
      .get("/api/dashboard/workload")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.members).toHaveLength(2);

    // Find members in response (sorted alphabetically in controller, but let's locate them dynamically)
    const memberAlpha = res.body.members.find((m) => m.memberName === "Officer Alpha");
    const memberBeta = res.body.members.find((m) => m.memberName === "Officer Beta");

    expect(memberAlpha).toBeDefined();
    expect(memberAlpha.assignedComplaints).toBe(3);
    expect(memberAlpha.pending).toBe(2);
    expect(memberAlpha.inProgress).toBe(1);
    expect(memberAlpha.resolved).toBe(0);

    expect(memberBeta).toBeDefined();
    expect(memberBeta.assignedComplaints).toBe(1);
    expect(memberBeta.pending).toBe(0);
    expect(memberBeta.inProgress).toBe(0);
    expect(memberBeta.resolved).toBe(1);

    // Mathematical calculations for highest, lowest and average workloads
    const totalAssigned = res.body.members.reduce((acc, curr) => acc + curr.assignedComplaints, 0);
    const avgWorkload = totalAssigned / res.body.members.length;
    expect(avgWorkload).toBe(2); // (3 + 1) / 2 = 2

    // Sorting to determine highest and lowest workloads
    const sortedByWorkload = [...res.body.members].sort((a, b) => b.assignedComplaints - a.assignedComplaints);
    expect(sortedByWorkload[0].memberName).toBe("Officer Alpha"); // Highest workload
    expect(sortedByWorkload[sortedByWorkload.length - 1].memberName).toBe("Officer Beta"); // Lowest workload
  });
});
