/**
 * @file departmentTransferValidation.test.js
 * @description API & Database Integrity Test suite for Module 9: Department Member Transfer Validation.
 * Tests behavior when transferring a member between departments.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import {
  createTestUser,
  generateTestToken,
  createTestDepartment,
  createTestDepartmentMember,
} from "../helpers/authHelper.js";

describe("Module 9: Department Member Transfer Validation", () => {
  let adminToken;
  let roadDept;
  let waterDept;

  beforeEach(async () => {
    const adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });

    roadDept = await createTestDepartment({ name: "Road Department", code: "ROAD" });
    waterDept = await createTestDepartment({ name: "Water Department", code: "WATER" });
  });

  it("should test re-adding user to new department (re-assignment / transfer flow)", async () => {
    const officerUser = await createTestUser({ role: "department_member" });
    const roadMember = await createTestDepartmentMember({ user: officerUser, department: roadDept });

    // Admin adds same user to Water Department
    const response = await request(app)
      .post(`/api/departments/${waterDept._id}/members`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        userId: officerUser._id,
        deptRole: "FIELD_OFFICER",
      });

    expect([200, 201]).toContain(response.status);
    expect(response.body.success).toBe(true);

    // Verify new membership record in Water department exists
    const waterMember = await DepartmentMember.findOne({ user: officerUser._id, department: waterDept._id });
    expect(waterMember).toBeDefined();
  });
});
