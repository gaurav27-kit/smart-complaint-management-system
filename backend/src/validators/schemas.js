/**
 * @file schemas.js
 * @description Centralized Zod validation schemas for API request bodies.
 */

import { z } from "zod";
import { COMPLAINT_STATUS_LIST, COMPLAINT_PRIORITY_LIST } from "../constants/complaintConstants.js";

const VALID_CATEGORIES = [
  // Internal Category Values
  "ROAD_DAMAGE",
  "WATER_LEAKAGE",
  "GARBAGE_COLLECTION",
  "STREET_LIGHT",
  "DRAINAGE",
  "PUBLIC_SAFETY",
  "HEALTH_SANITATION",
  "IT_WEBSITE",
  "OTHER",

  // Legacy Category Values (Backward Compatibility)
  "Road",
  "Water",
  "Electricity",
  "Garbage",
  "Street Light",
  "Drainage",
  "IT",
  "Other",
  "Public Safety",
  "Health",
];

export const registerSchema = z.object({
  fullName: z
    .string({ message: "All fields are required" })
    .trim()
    .min(1, "All fields are required")
    .max(100, "Full name cannot exceed 100 characters"),
  email: z
    .string({ message: "All fields are required" })
    .trim()
    .min(1, "All fields are required")
    .email("Please provide a valid email address"),
  password: z
    .string({ message: "All fields are required" })
    .min(6, "Password must be at least 6 characters"),
  phoneNumber: z.string().optional(),
  employeeId: z.string().optional(),
  role: z.enum(["user", "admin", "department_member"]).optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ message: "Email and password are required" })
    .trim()
    .min(1, "Email and password are required"),
  password: z
    .string({ message: "Email and password are required" })
    .min(1, "Email and password are required"),
});

export const googleAuthSchema = z
  .object({
    idToken: z.string().optional(),
    credential: z.string().optional(),
  })
  .refine(
    (data) =>
      Boolean(
        (data.idToken && data.idToken.trim()) ||
          (data.credential && data.credential.trim())
      ),
    {
      message: "Google ID token or credential is required",
    }
  );

export const createComplaintSchema = z.object({
  title: z
    .string({ message: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string({ message: "Description is required" })
    .trim()
    .min(1, "Description is required")
    .max(2000, "Description cannot exceed 2000 characters"),
  category: z.enum(VALID_CATEGORIES, {
    message: "Invalid category",
  }),
  location: z
    .string({ message: "Location is required" })
    .trim()
    .min(1, "Location is required"),
  priority: z.enum(COMPLAINT_PRIORITY_LIST, {
    message: "Invalid priority",
  }).optional(),
});

export const updateComplaintStatusSchema = z.object({
  status: z.enum(COMPLAINT_STATUS_LIST, {
    message: `Status must be one of: ${COMPLAINT_STATUS_LIST.join(", ")}`,
  }),
  adminComment: z.string().optional(),
  comment: z.string().optional(),
  note: z.string().optional(),
});

export const assignComplaintSchema = z
  .object({
    departmentId: z.string().optional(),
    department: z.string().optional(),
    memberId: z.string().optional(),
    assignedMember: z.string().optional(),
    officerId: z.string().optional(),
    fieldOfficerId: z.string().optional(),
    note: z.string().optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.departmentId ||
          data.department ||
          data.memberId ||
          data.assignedMember ||
          data.officerId ||
          data.fieldOfficerId
      ),
    {
      message:
        "Either department, member, or officer must be provided for assignment",
    }
  );

export const aiAnalyzeSchema = z.object({
  title: z
    .string({ message: "Title and description must be non-empty strings." })
    .trim()
    .min(1, "Title and description must be non-empty strings.")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string({ message: "Title and description must be non-empty strings." })
    .trim()
    .min(1, "Title and description must be non-empty strings.")
    .max(2000, "Description cannot exceed 2000 characters"),
});
