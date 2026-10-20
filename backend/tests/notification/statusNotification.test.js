/**
 * @file statusNotification.test.js
 * @description Module 4 & 5: Status Update & Resolution Proof Notifications.
 * Verifies citizen notification on every status transition and resolution proof upload.
 */

import { jest } from "@jest/globals";
import { notificationService } from "../../src/notifications/services/NotificationService.js";
import { emailService } from "../../src/notifications/services/EmailService.js";
import Notification from "../../src/models/Notification.js";
import { createTestUser, createTestComplaint } from "../helpers/authHelper.js";

describe("Module 4 & 5: Status Update & Resolution Notifications", () => {
  let citizen;
  let complaint;
  let sendSpy;
  let sendAsyncSpy;

  beforeEach(async () => {
    if (notificationService.dispatch.mockRestore) {
      notificationService.dispatch.mockRestore();
    }

    sendSpy = jest.spyOn(emailService, "send").mockResolvedValue({
      messageId: "mock-msg-status-001",
      provider: "smtp",
    });

    sendAsyncSpy = jest.spyOn(notificationService, "_sendAsync");

    citizen = await createTestUser({ role: "user", fullName: "Status Citizen" });
    complaint = await createTestComplaint({
      title: "Water Leak Report",
      category: "Water",
      status: "Pending",
      createdBy: citizen._id,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Status Transition Notifications", () => {
    it("should notify citizen when status changes from Pending to In Progress", async () => {
      complaint.status = "In Progress";
      const notification = await notificationService.sendComplaintStatusUpdated(
        citizen, complaint, "Pending"
      );

      expect(notification.type).toBe("COMPLAINT_STATUS_UPDATED");
      expect(notification.recipient.toString()).toBe(citizen._id.toString());

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }

      const dbNotif = await Notification.findById(notification._id);
      expect(dbNotif.metadata.oldStatus).toBe("Pending");
      expect(dbNotif.metadata.newStatus).toBe("In Progress");
    });

    it("should notify citizen when status changes from In Progress to Resolved", async () => {
      complaint.status = "Resolved";
      const notification = await notificationService.sendComplaintStatusUpdated(
        citizen, complaint, "In Progress"
      );

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }

      const dbNotif = await Notification.findById(notification._id);
      expect(dbNotif.metadata.oldStatus).toBe("In Progress");
      expect(dbNotif.metadata.newStatus).toBe("Resolved");
    });

    it("should create separate notification records for each status transition", async () => {
      // Pending → In Progress
      complaint.status = "In Progress";
      await notificationService.sendComplaintStatusUpdated(citizen, complaint, "Pending");

      // In Progress → Resolved
      complaint.status = "Resolved";
      await notificationService.sendComplaintStatusUpdated(citizen, complaint, "In Progress");

      await Promise.all(sendAsyncSpy.mock.results.map(r => r.value));

      const allStatusNotifs = await Notification.find({
        recipient: citizen._id,
        type: "COMPLAINT_STATUS_UPDATED",
      });
      expect(allStatusNotifs.length).toBe(2);
    });
  });

  describe("Resolution Notification", () => {
    it("should notify citizen when complaint is resolved", async () => {
      complaint.status = "Resolved";
      const notification = await notificationService.sendComplaintResolved(citizen, complaint);

      expect(notification.type).toBe("COMPLAINT_RESOLVED");
      expect(notification.recipient.toString()).toBe(citizen._id.toString());
      expect(notification.subject).toContain("Water Leak Report");

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }

      const dbNotif = await Notification.findById(notification._id);
      expect(dbNotif.metadata.complaintId.toString()).toBe(complaint._id.toString());
    });
  });
});
