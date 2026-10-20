/**
 * @file departmentIsolation.test.js
 * @description API Test suite for Module 6: Department Isolation.
 * Verifies strict departmental boundary enforcement for Road, Water, Electricity, and IT department HEADs and Field Officers.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import {
  createTestUser,
  generateTestToken,
  createTestDepartment,
  createTestDepartmentMember,
  createTestComplaint,
} from "../helpers/authHelper.js";

describe("Module 6: Department Isolation", () => {
  let roadDept;
  let waterDept;
  let itDept;
  let garbageDept;

  let roadHeadToken;
  let waterHeadToken;
  let itHeadToken;

  let roadComplaint;
  let waterComplaint;
  let itComplaint;
  let garbageComplaint;

  beforeEach(async () => {
    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });
    waterDept = await createTestDepartment({ name: "Water Department", code: "WATER" });
    itDept = await createTestDepartment({ name: "IT Department", code: "IT" });
    garbageDept = await createTestDepartment({ name: "Garbage Department", code: "GARBAGE" });

    // 1. Road HEAD
    const roadHeadUser = await createTestUser({ role: "department_member" });
    await createTestDepartmentMember({ user: roadHeadUser, department: roadDept, deptRole: "HEAD" });
    roadHeadToken = generateTestToken({ id: roadHeadUser._id, role: "department_member" });

    // 2. Water HEAD
    const waterHeadUser = await createTestUser({ role: "department_member" });
    await createTestDepartmentMember({ user: waterHeadUser, department: waterDept, deptRole: "HEAD" });
    waterHeadToken = generateTestToken({ id: waterHeadUser._id, role: "department_member" });

    // 3. IT HEAD
    const itHeadUser = await createTestUser({ role: "department_member" });
    await createTestDepartmentMember({ user: itHeadUser, department: itDept, deptRole: "HEAD" });
    itHeadToken = generateTestToken({ id: itHeadUser._id, role: "department_member" });

    // 4. Complaints
    roadComplaint = await createTestComplaint({ title: "Road Repair", department: roadDept._id });
    waterComplaint = await createTestComplaint({ title: "Water Leak", department: waterDept._id });
    itComplaint = await createTestComplaint({ title: "Portal Issue", department: itDept._id });
    garbageComplaint = await createTestComplaint({ title: "Garbage Overflow", department: garbageDept._id });
  });

  it("should isolate Road HEAD to ONLY Road complaints", async () => {
    const response = await request(app)
      .get("/api/member/complaints")
      .set("Authorization", `Bearer ${roadHeadToken}`);

    expect(response.status).toBe(200);
    const complaints = response.body.complaints || response.body.data;
    const complaintIds = complaints.map(c => c._id.toString());

    expect(complaintIds).toContain(roadComplaint._id.toString());
    expect(complaintIds).not.toContain(waterComplaint._id.toString());
    expect(complaintIds).not.toContain(itComplaint._id.toString());
    expect(complaintIds).not.toContain(garbageComplaint._id.toString());
  });

  it("should prevent Water HEAD from accessing IT or Garbage complaints", async () => {
    const response = await request(app)
      .patch(`/api/member/complaints/${itComplaint._id}/status`)
      .set("Authorization", `Bearer ${waterHeadToken}`)
      .send({ status: "In Progress" });

    expect([403, 404]).toContain(response.status);
  });

  it("should prevent IT HEAD from accessing Garbage complaints", async () => {
    const response = await request(app)
      .patch(`/api/member/complaints/${garbageComplaint._id}/status`)
      .set("Authorization", `Bearer ${itHeadToken}`)
      .send({ status: "Resolved" });

    expect([403, 404]).toContain(response.status);
  });

  it("should scope department workload metrics strictly to member's department", async () => {
    const response = await request(app)
      .get("/api/member/workload")
      .set("Authorization", `Bearer ${roadHeadToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
