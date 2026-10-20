/**
 * @file emailNotification.test.js
 * @description Module 1: Complaint Creation Notifications.
 * Verifies that complaint submission triggers citizen confirmation notification
 * and that the notification is persisted correctly in MongoDB.
 */

import { jest } from "@jest/globals";
import { notificationService } from "../../src/notifications/services/NotificationService.js";
import { emailService } from "../../src/notifications/services/EmailService.js";
import Notification from "../../src/models/Notification.js";
import { createTestUser, createTestComplaint } from "../helpers/authHelper.js";

// Mock ONLY the external SMTP transport layer
describe("Module 1: Complaint Creation & Subsystem Unit Tests", () => {
  let citizen;
  let complaint;
  let providerSendSpy;
  let sendAsyncSpy;

  beforeEach(async () => {
    if (notificationService.dispatch && notificationService.dispatch.mockRestore) {
      notificationService.dispatch.mockRestore();
    }
    if (notificationService.sendEmailVerification && notificationService.sendEmailVerification.mockRestore) {
      notificationService.sendEmailVerification.mockRestore();
    }
    if (notificationService.sendPasswordReset && notificationService.sendPasswordReset.mockRestore) {
      notificationService.sendPasswordReset.mockRestore();
    }
    if (emailService.send && emailService.send.mockRestore) {
      emailService.send.mockRestore();
    }
    
    // Set up local spy on the SMTP provider's send method to allow EmailService wrapper code to execute and be covered!
    providerSendSpy = jest.spyOn(emailService.provider, "send").mockResolvedValue({
      messageId: "mock-msg-id-001",
      provider: "smtp",
    });
    
    sendAsyncSpy = jest.spyOn(notificationService, "_sendAsync");

    citizen = await createTestUser({ role: "user", fullName: "Jane Citizen" });
    complaint = await createTestComplaint({
      title: "Broken Streetlight",
      category: "Electricity",
      location: "Sector 12, Main Road",
      priority: "High",
      createdBy: citizen._id,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Complaint Creation Notifications", () => {
    it("should create a COMPLAINT_SUBMITTED notification for the citizen", async () => {
      const notification = await notificationService.sendComplaintSubmitted(citizen, complaint);

      expect(notification).toBeDefined();
      expect(notification.type).toBe("COMPLAINT_SUBMITTED");
      expect(notification.recipient.toString()).toBe(citizen._id.toString());
      expect(notification.subject).toContain("Broken Streetlight");
      expect(notification.status).toBe("pending"); // Persisted before send
      expect(notification.channel).toBe("email");

      // Wait for the fire-and-forget background job to complete
      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }

      // DB persistence check
      const dbNotif = await Notification.findById(notification._id);
      expect(dbNotif).toBeDefined();
      expect(dbNotif.type).toBe("COMPLAINT_SUBMITTED");
      expect(dbNotif.metadata.complaintId.toString()).toBe(complaint._id.toString());
    });

    it("should store rendered HTML body in the notification record", async () => {
      const notification = await notificationService.sendComplaintSubmitted(citizen, complaint);

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }

      const dbNotif = await Notification.findById(notification._id);
      expect(dbNotif.body).toBeDefined();
      expect(dbNotif.body.length).toBeGreaterThan(0);
      expect(typeof dbNotif.body).toBe("string");
    });

    it("should store recipientEmail in notification metadata", async () => {
      const notification = await notificationService.sendComplaintSubmitted(citizen, complaint);

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }

      const dbNotif = await Notification.findById(notification._id);
      expect(dbNotif.metadata.recipientEmail).toBe(citizen.email);
    });
  });

  describe("EmailService Unit Tests", () => {
    it("should successfully validate and send email through the provider", async () => {
      const result = await emailService.send({
        to: "recipient@example.com",
        subject: "Unit Test Subject",
        html: "<p>Hello World</p>",
      });

      expect(result.messageId).toBe("mock-msg-id-001");
      expect(providerSendSpy).toHaveBeenCalledTimes(1);
    });

    it("should throw validation error if 'to' is missing or not a string", async () => {
      await expect(emailService.send({
        subject: "Subject Only",
        html: "<p>No To</p>",
      })).rejects.toThrow("EmailService: `to` is required");
    });

    it("should throw validation error if 'subject' is missing or not a string", async () => {
      await expect(emailService.send({
        to: "test@example.com",
        html: "<p>No Subject</p>",
      })).rejects.toThrow("EmailService: `subject` is required");
    });

    it("should throw validation error if 'html' is missing or not a string", async () => {
      await expect(emailService.send({
        to: "test@example.com",
        subject: "Subject",
      })).rejects.toThrow("EmailService: `html` is required");
    });

    it("should wrap and re-throw email provider send errors", async () => {
      providerSendSpy.mockRejectedValue(new Error("SMTP down"));

      await expect(emailService.send({
        to: "test@example.com",
        subject: "Subject",
        html: "<p>Test</p>",
      })).rejects.toThrow("Email delivery failed via smtp: SMTP down");
    });

    it("should verify provider connection health", async () => {
      const verifySpy = jest.spyOn(emailService.provider, "verify").mockResolvedValue(true);
      const isHealthy = await emailService.verifyConnection();

      expect(isHealthy).toBe(true);
      expect(verifySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("NotificationService Additional Flows", () => {
    it("should throw error if template rendering fails", async () => {
      await expect(
        notificationService.dispatch({
          recipient: citizen,
          type: "WELCOME",
          subject: "Welcome Test",
          templateName: "nonExistentTemplateNameForTesting",
          templateVars: {},
        })
      ).rejects.toThrow("Cannot find template 'nonExistentTemplateNameForTesting.html'");
    });

    it("should send email verification notification", async () => {
      const notif = await notificationService.sendEmailVerification(citizen, "verification-token-xyz");
      
      expect(notif.type).toBe("EMAIL_VERIFICATION");
      expect(notif.subject).toContain("Verify your email");

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }
    });

    it("should send forgot password notification", async () => {
      const notif = await notificationService.sendForgotPassword(citizen, "reset-token-xyz");
      
      expect(notif.type).toBe("FORGOT_PASSWORD");
      expect(notif.subject).toContain("Password reset request");

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }
    });

    it("should send password reset success confirmation", async () => {
      const notif = await notificationService.sendPasswordResetSuccess(citizen);
      
      expect(notif.type).toBe("PASSWORD_RESET_SUCCESS");
      expect(notif.subject).toContain("password has been reset");

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }
    });

    it("should send welcome email notification", async () => {
      const notif = await notificationService.sendWelcomeEmail(citizen);
      
      expect(notif.type).toBe("WELCOME");
      expect(notif.subject).toContain("Welcome to SCMS");

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }
    });

    it("should send new complaint notification to admin", async () => {
      const adminUser = await createTestUser({ role: "admin", fullName: "System Admin" });
      const notif = await notificationService.sendAdminNewComplaint(adminUser, complaint, citizen);
      
      expect(notif.type).toBe("ADMIN_NEW_COMPLAINT");
      expect(notif.subject).toContain("New complaint");

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }
    });

    it("should handle various complaint formats in metadata", async () => {
      // 1. metadata.complaintId is string
      const notif1 = await notificationService.dispatch({
        recipient: citizen,
        type: "COMPLAINT_SUBMITTED",
        subject: "Test 1",
        templateName: "complaintSubmitted",
        templateVars: {
          userName: citizen.fullName,
          complaintId: "12345",
          complaintTitle: "Test",
          complaintCategory: "Test",
          complaintLocation: "Test",
          complaintPriority: "High",
          createdAt: "date",
          complaintUrl: "url",
        },
        metadata: {
          complaintId: "6a690970e46cab8e67342986",
        },
      });
      expect(notif1.complaintId.toString()).toBe("6a690970e46cab8e67342986");

      // 2. metadata.complaint is string
      const notif2 = await notificationService.dispatch({
        recipient: citizen,
        type: "COMPLAINT_SUBMITTED",
        subject: "Test 2",
        templateName: "complaintSubmitted",
        templateVars: {
          userName: citizen.fullName,
          complaintId: "12345",
          complaintTitle: "Test",
          complaintCategory: "Test",
          complaintLocation: "Test",
          complaintPriority: "High",
          createdAt: "date",
          complaintUrl: "url",
        },
        metadata: {
          complaint: "6a690970e46cab8e67342986",
        },
      });
      expect(notif2.complaintId.toString()).toBe("6a690970e46cab8e67342986");

      // 3. metadata.complaint is empty/null
      const notif3 = await notificationService.dispatch({
        recipient: citizen,
        type: "COMPLAINT_SUBMITTED",
        subject: "Test 3",
        templateName: "complaintSubmitted",
        templateVars: {
          userName: citizen.fullName,
          complaintId: "12345",
          complaintTitle: "Test",
          complaintCategory: "Test",
          complaintLocation: "Test",
          complaintPriority: "High",
          createdAt: "date",
          complaintUrl: "url",
        },
        metadata: {},
      });
      expect(notif3.complaintId).toBeNull();
    });

    it("should fallback message assignment properly", async () => {
      // Test metadata.message fallback
      const notifMsg1 = await notificationService.dispatch({
        recipient: citizen,
        type: "COMPLAINT_SUBMITTED",
        subject: "Test Msg 1",
        templateName: "complaintSubmitted",
        templateVars: {
          userName: citizen.fullName,
          complaintId: "12345",
          complaintTitle: "Test",
          complaintCategory: "Test",
          complaintLocation: "Test",
          complaintPriority: "High",
          createdAt: "date",
          complaintUrl: "url",
        },
        metadata: { message: "custom message" },
      });
      expect(notifMsg1.message).toBe("custom message");

      // Test metadata.description fallback
      const notifMsg2 = await notificationService.dispatch({
        recipient: citizen,
        type: "COMPLAINT_SUBMITTED",
        subject: "Test Msg 2",
        templateName: "complaintSubmitted",
        templateVars: {
          userName: citizen.fullName,
          complaintId: "12345",
          complaintTitle: "Test",
          complaintCategory: "Test",
          complaintLocation: "Test",
          complaintPriority: "High",
          createdAt: "date",
          complaintUrl: "url",
        },
        metadata: { description: "custom description" },
      });
      expect(notifMsg2.message).toBe("custom description");
    });

    it("should handle empty or missing stats fields in daily summary and weekly analytics", async () => {
      const adminUser = await createTestUser({ role: "admin", fullName: "Admin Fallback" });

      // Test daily summary fallback branches (stats = {})
      const notifDaily = await notificationService.sendDailySummary(adminUser, {});
      expect(notifDaily.type).toBe("DAILY_SUMMARY");

      if (sendAsyncSpy.mock.results.length > 0) {
        await sendAsyncSpy.mock.results[0].value;
      }

      // Test weekly analytics fallback branches (stats = {})
      const notifWeekly = await notificationService.sendWeeklyAnalytics(adminUser, {});
      expect(notifWeekly.type).toBe("WEEKLY_ANALYTICS");

      if (sendAsyncSpy.mock.results.length > 1) {
        await sendAsyncSpy.mock.results[1].value;
      }
    });
  });
});
