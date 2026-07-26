/**
 * Timeline Helper — Creates structured timeline event objects.
 *
 * All timeline event creation is centralized here so that:
 * 1. Event structure is consistent across all controllers
 * 2. New event types can be added in one place
 * 3. No duplication of event-building logic
 */

/**
 * Build a timeline event object.
 *
 * @param {object} options
 * @param {string} options.type        - Event type enum value (e.g. "COMPLAINT_CREATED")
 * @param {string} options.title       - Human-readable title
 * @param {string} [options.description] - Optional description
 * @param {string} options.performedBy - User/Admin ObjectId
 * @param {string} options.performedByRole - "user" or "admin"
 * @param {object} [options.metadata]  - Flexible metadata (oldStatus, newStatus, imageCount, etc.)
 * @returns {object} Timeline event document ready to push into complaint.timeline
 */
export const createTimelineEvent = ({
  type,
  title,
  description = "",
  performedBy,
  performedByRole = "user",
  metadata = {},
}) => ({
  type,
  title,
  description,
  performedBy,
  performedByRole,
  metadata,
  createdAt: new Date(),
});

// --- Pre-built event factories for common actions ---

export const complaintCreatedEvent = (userId, role = "user", { imageCount = 0 } = {}) =>
  createTimelineEvent({
    type: "COMPLAINT_CREATED",
    title: "Complaint Created",
    description: imageCount > 0
      ? `Complaint submitted with ${imageCount} image(s)`
      : "Complaint submitted",
    performedBy: userId,
    performedByRole: role,
    metadata: { imageCount },
  });

export const complaintUpdatedEvent = (userId, role = "user", { changedFields = [] } = {}) =>
  createTimelineEvent({
    type: "COMPLAINT_UPDATED",
    title: "Complaint Updated",
    description: changedFields.length > 0
      ? `Updated: ${changedFields.join(", ")}`
      : "Complaint details updated",
    performedBy: userId,
    performedByRole: role,
    metadata: { changedFields },
  });

export const imagesUploadedEvent = (userId, role = "user", { imageCount = 0 } = {}) =>
  createTimelineEvent({
    type: "IMAGES_UPLOADED",
    title: "Images Uploaded",
    description: `${imageCount} image(s) added`,
    performedBy: userId,
    performedByRole: role,
    metadata: { imageCount },
  });

export const imagesDeletedEvent = (userId, role = "user", { imageCount = 0 } = {}) =>
  createTimelineEvent({
    type: "IMAGES_DELETED",
    title: "Images Deleted",
    description: `${imageCount} image(s) removed`,
    performedBy: userId,
    performedByRole: role,
    metadata: { imageCount },
  });

export const statusChangedEvent = (userId, role = "admin", { oldStatus, newStatus } = {}) =>
  createTimelineEvent({
    type: newStatus === "Resolved" ? "COMPLAINT_RESOLVED" : "STATUS_CHANGED",
    title: newStatus === "Resolved" ? "Complaint Resolved" : "Status Changed",
    description: `${oldStatus} → ${newStatus}`,
    performedBy: userId,
    performedByRole: role,
    metadata: { oldStatus, newStatus },
  });

export const departmentAssignedEvent = (
  userId,
  role = "admin",
  { departmentId, departmentName } = {},
) =>
  createTimelineEvent({
    type: "DEPARTMENT_ASSIGNED",
    title: "Department Assigned",
    description: `Complaint assigned to ${departmentName}.`,
    performedBy: userId,
    performedByRole: role || "admin",
    metadata: { departmentId, departmentName },
  });

export const memberAssignedEvent = (
  userId,
  role = "admin",
  { memberId, memberName, departmentId, departmentName, departmentRole } = {},
) =>
  createTimelineEvent({
    type: "MEMBER_ASSIGNED",
    title: "Department Member Assigned",
    description: `Complaint assigned to ${memberName}.`,
    performedBy: userId,
    performedByRole: role || "admin",
    metadata: {
      memberId,
      memberName,
      departmentId,
      departmentName,
      departmentRole,
    },
  });

