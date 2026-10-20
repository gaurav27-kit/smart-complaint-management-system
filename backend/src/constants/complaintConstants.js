/**
 * @file complaintConstants.js
 * @description Centralized Single Source of Truth for Complaint Statuses & Priorities.
 */

export const COMPLAINT_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const COMPLAINT_STATUS_LIST = [
  COMPLAINT_STATUS.PENDING,
  COMPLAINT_STATUS.IN_PROGRESS,
  COMPLAINT_STATUS.RESOLVED,
  COMPLAINT_STATUS.CLOSED,
];

export const COMPLAINT_PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const COMPLAINT_PRIORITY_LIST = [
  COMPLAINT_PRIORITY.LOW,
  COMPLAINT_PRIORITY.MEDIUM,
  COMPLAINT_PRIORITY.HIGH,
];
