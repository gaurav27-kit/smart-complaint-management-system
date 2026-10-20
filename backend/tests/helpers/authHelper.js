/**
 * @file authHelper.js
 * @description Helper functions for creating test users, departments, department members, complaints, and generating tokens.
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../../src/models/User.js";
import Department from "../../src/models/Department.js";
import DepartmentMember from "../../src/models/DepartmentMember.js";
import Complaint from "../../src/models/Complaint.js";

/**
 * Generate a signed JWT token for testing.
 * @param {Object} payload - Token payload ({ id, role })
 * @returns {String} JWT token
 */
export const generateTestToken = (payload) => {
  const tokenPayload = {
    id: payload.id || payload._id,
    role: payload.role || "user",
  };
  return jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET || "test_jwt_secret_key_scms_2026_super_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

/**
 * Helper to directly create a seeded test user in the database.
 * @param {Object} userOverrides
 * @returns {Promise<Object>} Created user Mongoose document
 */
export const createTestUser = async (userOverrides = {}) => {
  const rawPassword = userOverrides.password || "password123";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const userData = {
    fullName: "Test User",
    email: `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`,
    password: hashedPassword,
    role: userOverrides.role || "user",
    emailVerified: true,
    isActive: true,
    ...userOverrides,
  };

  if (userOverrides.password && !userOverrides.isHashed) {
    userData.password = hashedPassword;
  }

  delete userData.isHashed;

  const user = await User.create(userData);
  return user;
};

/**
 * Helper to create a test Department in the database.
 * @param {Object} deptOverrides
 * @returns {Promise<Object>} Created Department document
 */
export const createTestDepartment = async (deptOverrides = {}) => {
  const uniqueCode = `DEPT_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const deptData = {
    name: `Test Dept ${uniqueCode}`,
    code: uniqueCode,
    description: "Test Department Description",
    isActive: true,
    ...deptOverrides,
  };
  return await Department.create(deptData);
};

/**
 * Helper to create a test DepartmentMember in the database.
 * @param {Object} memberOverrides
 * @returns {Promise<Object>} Created DepartmentMember document
 */
export const createTestDepartmentMember = async (memberOverrides = {}) => {
  let user = memberOverrides.user;
  if (!user) {
    user = await createTestUser({ role: "department_member" });
  }

  let department = memberOverrides.department;
  if (!department) {
    department = await createTestDepartment();
  }

  const memberData = {
    user: user._id || user,
    department: department._id || department,
    deptRole: memberOverrides.deptRole || "FIELD_OFFICER",
    isActive: memberOverrides.isActive !== undefined ? memberOverrides.isActive : true,
    isPrimary: true,
    ...memberOverrides,
  };

  return await DepartmentMember.create(memberData);
};

/**
 * Helper to create a test Complaint in the database.
 * @param {Object} complaintOverrides
 * @returns {Promise<Object>} Created Complaint document
 */
export const createTestComplaint = async (complaintOverrides = {}) => {
  let createdBy = complaintOverrides.createdBy;
  if (!createdBy) {
    const user = await createTestUser();
    createdBy = user._id;
  }

  const complaintData = {
    title: "Test Complaint Title",
    description: "Detailed description of the complaint for testing purposes.",
    category: "Road",
    location: "Main Street, Sector 5",
    priority: "Medium",
    status: "Pending",
    createdBy,
    timeline: [
      {
        type: "COMPLAINT_CREATED",
        title: "Complaint Created",
        description: "Complaint submitted successfully.",
        performedBy: createdBy,
        performedByRole: "user",
      },
    ],
    ...complaintOverrides,
  };

  return await Complaint.create(complaintData);
};
