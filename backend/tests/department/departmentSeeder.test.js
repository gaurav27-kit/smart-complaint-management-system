/**
 * @file departmentSeeder.test.js
 * @description Unit & Integration Test suite for Module 7 & Module 10: Department Seeder & Idempotency.
 * Verifies seeding default departments (ROAD, WATER, ELECTRIC, GARBAGE, IT, HEALTH, SAFETY) and 100% idempotency.
 */

import seedDepartments from "../../src/seeders/departmentSeeder.js";
import Department from "../../src/models/Department.js";
import { createTestUser } from "../helpers/authHelper.js";

describe("Module 7 & Module 10: Department Seeder & Idempotency", () => {
  let adminUser;

  beforeEach(async () => {
    adminUser = await createTestUser({ role: "admin" });
  });

  it("should seed all default departments into MongoDB on initial run", async () => {
    const summary = await seedDepartments({ adminId: adminUser._id });

    expect(summary).toBeDefined();
    expect(summary.seeded).toBe(7);
    expect(summary.skipped).toBe(0);
    expect(summary.total).toBe(7);

    // Verify all 7 default codes exist
    const expectedCodes = ["ROAD", "WATER", "ELECTRIC", "GARBAGE", "SAFETY", "HEALTH", "IT"];
    const dbDepartments = await Department.find({ code: { $in: expectedCodes } });

    expect(dbDepartments.length).toBe(7);
    dbDepartments.forEach(dept => {
      expect(dept.isActive).toBe(true);
      expect(dept.createdBy.toString()).toBe(adminUser._id.toString());
    });
  });

  it("should be 100% idempotent: running seeder twice creates zero duplicate documents", async () => {
    // Run 1
    const run1 = await seedDepartments({ adminId: adminUser._id });
    expect(run1.seeded).toBe(7);

    // Run 2
    const run2 = await seedDepartments({ adminId: adminUser._id });
    expect(run2.seeded).toBe(0);
    expect(run2.skipped).toBe(7);

    // Total count in DB must remain exactly 7
    const totalCount = await Department.countDocuments();
    expect(totalCount).toBe(7);
  });

  it("should preserve unique index constraints on department code and name", async () => {
    await seedDepartments({ adminId: adminUser._id });

    const roadDept = await Department.findOne({ code: "ROAD" });
    expect(roadDept).toBeDefined();

    // Attempting manual duplicate creation must throw MongoServerError E11000
    await expect(
      Department.create({
        name: "Road Department",
        code: "ROAD",
      })
    ).rejects.toThrow();
  });
});
