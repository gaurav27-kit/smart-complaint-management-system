/**
 * @file DepartmentMember.js
 * @description Production-ready junction model connecting User and Department models.
 *
 * Responsibilities:
 * - Establishes many-to-many relationship between Users (admins/staff) and Departments
 * - Supports granular intra-department roles (HEAD, ADMIN, SUPERVISOR, FIELD_OFFICER)
 * - Facilitates tracking of primary department assignments and audit history (assignedBy)
 * - Optimized with compound unique and query performance indexes
 */

import mongoose from "mongoose";

const departmentMemberSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department reference is required"],
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    deptRole: {
      type: String,
      enum: ["HEAD", "ADMIN", "SUPERVISOR", "FIELD_OFFICER"],
      default: "ADMIN",
    },

    isPrimary: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Unique compound index preventing duplicate membership records for the same department and user
departmentMemberSchema.index({ department: 1, user: 1 }, { unique: true });

// Performance indexes for membership lookup and access control checks
departmentMemberSchema.index({ user: 1, isActive: 1 });
departmentMemberSchema.index({ department: 1, isActive: 1 });

const DepartmentMember =
  mongoose.models.DepartmentMember ||
  mongoose.model("DepartmentMember", departmentMemberSchema);

export default DepartmentMember;
