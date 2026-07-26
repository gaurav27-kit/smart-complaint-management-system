/**
 * @file dashboardController.js
 * @description Admin dashboard metrics controller using MongoDB aggregation.
 */

import Complaint from "../models/Complaint.js";
import Department from "../models/Department.js";
import DepartmentMember from "../models/DepartmentMember.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";

/**
 * @desc    Get admin dashboard metrics
 * @route   GET /api/dashboard/admin
 * @access  Private/Admin
 */
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const stats = await Complaint.aggregate([
    {
      $group: {
        _id: null,
        totalComplaints: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
        },
        closed: {
          $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] },
        },
        highPriority: {
          $sum: { $cond: [{ $eq: ["$priority", "High"] }, 1, 0] },
        },
        mediumPriority: {
          $sum: { $cond: [{ $eq: ["$priority", "Medium"] }, 1, 0] },
        },
        lowPriority: {
          $sum: { $cond: [{ $eq: ["$priority", "Low"] }, 1, 0] },
        },
      },
    },
  ]);

  const metrics = stats[0]
    ? {
        totalComplaints: stats[0].totalComplaints,
        pending: stats[0].pending,
        inProgress: stats[0].inProgress,
        resolved: stats[0].resolved,
        closed: stats[0].closed,
        highPriority: stats[0].highPriority,
        mediumPriority: stats[0].mediumPriority,
        lowPriority: stats[0].lowPriority,
      }
    : {
        totalComplaints: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0,
      };

  logger.info({
    message: "Admin dashboard metrics retrieved successfully",
    adminId: req.user?.id,
    metrics,
  });

  res.status(200).json({
    success: true,
    data: metrics,
    ...metrics,
  });
});

/**
 * @desc    Get department-wise complaint statistics
 * @route   GET /api/dashboard/departments
 * @access  Private/Admin
 */
export const getDepartmentDashboard = asyncHandler(async (req, res) => {
  const departments = await Department.aggregate([
    {
      $lookup: {
        from: "complaints",
        localField: "_id",
        foreignField: "department",
        as: "complaints",
      },
    },
    {
      $project: {
        _id: 0,
        departmentId: "$_id",
        departmentName: "$name",
        totalComplaints: { $size: "$complaints" },
        pending: {
          $size: {
            $filter: {
              input: "$complaints",
              as: "c",
              cond: { $eq: ["$$c.status", "Pending"] },
            },
          },
        },
        inProgress: {
          $size: {
            $filter: {
              input: "$complaints",
              as: "c",
              cond: { $eq: ["$$c.status", "In Progress"] },
            },
          },
        },
        resolved: {
          $size: {
            $filter: {
              input: "$complaints",
              as: "c",
              cond: { $eq: ["$$c.status", "Resolved"] },
            },
          },
        },
        closed: {
          $size: {
            $filter: {
              input: "$complaints",
              as: "c",
              cond: { $eq: ["$$c.status", "Closed"] },
            },
          },
        },
      },
    },
    {
      $sort: { departmentName: 1 },
    },
  ]);

  logger.info({
    message: "Department dashboard statistics retrieved successfully",
    adminId: req.user?.id,
    departmentCount: departments.length,
  });

  res.status(200).json({
    success: true,
    departments,
  });
});

/**
 * @desc    Get officer workload dashboard statistics
 * @route   GET /api/dashboard/workload
 * @access  Private/Admin
 */
export const getOfficerWorkloadDashboard = asyncHandler(async (req, res) => {
  const members = await DepartmentMember.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    {
      $unwind: "$userInfo",
    },
    {
      $lookup: {
        from: "departments",
        localField: "department",
        foreignField: "_id",
        as: "deptInfo",
      },
    },
    {
      $unwind: "$deptInfo",
    },
    {
      $lookup: {
        from: "complaints",
        localField: "_id",
        foreignField: "assignedMember",
        as: "complaints",
      },
    },
    {
      $project: {
        _id: 0,
        memberId: "$_id",
        memberName: "$userInfo.fullName",
        email: "$userInfo.email",
        departmentId: "$deptInfo._id",
        departmentName: "$deptInfo.name",
        departmentRole: "$deptRole",
        assignedComplaints: { $size: "$complaints" },
        pending: {
          $size: {
            $filter: {
              input: "$complaints",
              as: "c",
              cond: { $eq: ["$$c.status", "Pending"] },
            },
          },
        },
        inProgress: {
          $size: {
            $filter: {
              input: "$complaints",
              as: "c",
              cond: { $eq: ["$$c.status", "In Progress"] },
            },
          },
        },
        resolved: {
          $size: {
            $filter: {
              input: "$complaints",
              as: "c",
              cond: { $eq: ["$$c.status", "Resolved"] },
            },
          },
        },
        closed: {
          $size: {
            $filter: {
              input: "$complaints",
              as: "c",
              cond: { $eq: ["$$c.status", "Closed"] },
            },
          },
        },
      },
    },
    {
      $sort: { memberName: 1 },
    },
  ]);

  logger.info({
    message: "Officer workload dashboard statistics retrieved successfully",
    adminId: req.user?.id,
    memberCount: members.length,
  });

  res.status(200).json({
    success: true,
    members,
  });
});

/**
 * @desc    Get monthly complaint trends
 * @route   GET /api/dashboard/monthly
 * @access  Private/Admin
 */
export const getMonthlyComplaintTrends = asyncHandler(async (req, res) => {
  const monthly = await Complaint.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
    {
      $project: {
        _id: 0,
        month: {
          $dateToString: {
            format: "%Y-%m",
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: 1,
              },
            },
          },
        },
        count: 1,
      },
    },
  ]);

  logger.info({
    message: "Monthly complaint trends retrieved successfully",
    adminId: req.user?.id,
    dataPoints: monthly.length,
  });

  res.status(200).json({
    success: true,
    monthly,
  });
});
