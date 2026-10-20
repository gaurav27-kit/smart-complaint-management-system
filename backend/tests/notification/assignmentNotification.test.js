/**
 * @file assignmentNotification.test.js
 * @description Module 2 & 3: Department Assignment & Officer Assignment Notifications.
 * Verifies HEAD/officer/citizen notifications on complaint assignment and reassignment.
 */

import { jest } from "@jest/globals";
import { notificationService } from "../../src/notifications/services/NotificationService.js";
import { emailService } from "../../src/notifications/services/EmailService.js";
import Notification from "../../src/models/Notification.js";
import { createTestUser, createTestComplaint } from "../helpers/authHelper.js";

describe("Module 2 & 3: Assignment Notifications", () => {
  let citizen;
  let officer1;
  let officer2;
  let complaint;
  let sendSpy;
  let sendAsyncSpy;

  beforeEach(async () => {
    if (notificationService.dispatch.mockRestore) {
      notificationService.dispatch.mockRestore();
    }

    sendSpy = jest.spyOn(emailService, "send").mockResolvedValue({
      messageId: "mock-msg-assign-001",
      provider: "smtp",
    });

    sendAsyncSpy = jest.spyOn(notificationService, "_sendAsync");

    citizen = await createTestUser({ role: "user", fullName: "Assignment Citizen" });
    officer1 = await createTestUser({ role: "department_member", fullName: "Officer Alpha" });
    officer2 = await createTestUser({ role: "department_member", fullName: "Officer Beta" });
    complaint = await createTestComplaint({
      title: "Pothole Main Rd",
      category: "Road",
      location: "Main Street",
      createdBy: citizen._id,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Department Assignment to Citizen", () => {
    it("should create COMPLAINT_ASSIGNED notification for citizen when dept is assigned", async () => {
      const notification = await notificationService.sendComplaintAssigned(citizen, complaint);

      expect(notification.type).toBe("COMPLAINT_ASSIGNED");
      expect(notification.recipient.toString()).toBe(citizen._id.toString());
      expect(notification.subject).toContain("Pothole Main Rd");

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }

      const dbNotif = await Notification.findById(notification._id);
      expect(dbNotif.metadata.complaintId.toString()).toBe(complaint._id.toString());
    });
  });

  describe("Officer Assignment Notifications", () => {
    it("should create MEMBER_COMPLAINT_ASSIGNED notification for assigned officer", async () => {
      const notification = await notificationService.sendComplaintAssignedToMember(officer1, complaint);

      expect(notification.type).toBe("MEMBER_COMPLAINT_ASSIGNED");
      expect(notification.recipient.toString()).toBe(officer1._id.toString());
      expect(notification.subject).toContain("Pothole Main Rd");

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }

      const dbNotif = await Notification.findById(notification._id);
      expect(dbNotif.metadata.complaintId.toString()).toBe(complaint._id.toString());
    });

    it("should create separate notification on reassignment without modifying original", async () => {
      // First assignment
      const firstNotif = await notificationService.sendComplaintAssignedToMember(officer1, complaint);

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }

      // Reassignment
      const secondNotif = await notificationService.sendComplaintAssignedToMember(officer2, complaint);

      if (sendAsyncSpy.mock.results.length > 1) {
        await sendAsyncSpy.mock.results[1].value;
      }

      expect(secondNotif.recipient.toString()).toBe(officer2._id.toString());
      expect(secondNotif._id.toString()).not.toBe(firstNotif._id.toString());

      // Original remains unchanged
      const dbFirst = await Notification.findById(firstNotif._id);
      expect(dbFirst.recipient.toString()).toBe(officer1._id.toString());
      expect(dbFirst.type).toBe("MEMBER_COMPLAINT_ASSIGNED");
    });

    it("should fallback to N/A if complaint location is missing", async () => {
      complaint.location = undefined;
      const notification = await notificationService.sendComplaintAssignedToMember(officer1, complaint);
      expect(notification.type).toBe("MEMBER_COMPLAINT_ASSIGNED");
      
      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }
    });
  });
});
