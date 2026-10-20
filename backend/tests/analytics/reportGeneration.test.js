/**
 * @file reportGeneration.test.js
 * @description API & Mathematical test suite for report generation including CSV, Excel formats and manual triggers.
 */

import request from "supertest";
import app from "../helpers/testApp.js";
import Complaint from "../../src/models/Complaint.js";
import User from "../../src/models/User.js";
import Notification from "../../src/models/Notification.js";
import { createTestUser, generateTestToken, createTestComplaint } from "../helpers/authHelper.js";
import { jest } from "@jest/globals";
import { notificationService } from "../../src/notifications/services/NotificationService.js";

describe("Report Generation & Export Verification", () => {
  let adminUser;
  let adminToken;
  let citizenUser;

  beforeEach(async () => {
    adminUser = await createTestUser({ role: "admin" });
    adminToken = generateTestToken({ id: adminUser._id, role: "admin" });
    citizenUser = await createTestUser({ role: "user" });

    // Mock/Spy on notificationService.dispatch
    jest.spyOn(notificationService, "dispatch").mockResolvedValue({ success: true });
  });

  describe("API Report Triggers", () => {
    it("should allow admin to manually trigger daily summary report dispatch (202 Accepted)", async () => {
      const res = await request(app)
        .post("/api/notifications/send-daily-summary")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Daily summary dispatch initiated");
    });

    it("should allow admin to manually trigger weekly analytics report dispatch (202 Accepted)", async () => {
      const res = await request(app)
        .post("/api/notifications/send-weekly-analytics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Weekly analytics dispatch initiated");
    });

    it("should reject non-admin report trigger attempts (403 Forbidden)", async () => {
      const citizenToken = generateTestToken({ id: citizenUser._id, role: "user" });

      const res = await request(app)
        .post("/api/notifications/send-daily-summary")
        .set("Authorization", `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Format Generation & Data Parsing (CSV & Excel simulation)", () => {
    it("should generate a valid CSV representation of complaints with correct headers, row counts and totals", async () => {
      // Seed data
      await createTestComplaint({ title: "Broken wire", category: "Electricity", priority: "High", status: "Pending", createdBy: citizenUser._id });
      await createTestComplaint({ title: "Sewage leak", category: "Drainage", priority: "High", status: "Resolved", createdBy: citizenUser._id });
      await createTestComplaint({ title: "Road blockage", category: "Road", priority: "Medium", status: "In Progress", createdBy: citizenUser._id });

      // Fetch complaints from DB directly for report generation
      const complaints = await Complaint.find({}).lean();
      expect(complaints).toHaveLength(3);

      // Simulate CSV Export Helper
      const generateCSV = (data) => {
        const headers = ["ID", "Title", "Category", "Priority", "Status", "CreatedBy"];
        const rows = data.map((item) => [
          item._id.toString(),
          item.title,
          item.category,
          item.priority,
          item.status,
          item.createdBy.toString(),
        ]);
        
        // Compute Totals
        const totalRows = rows.length;
        const totalHighPriority = data.filter((item) => item.priority === "High").length;
        
        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.join(",")),
          "", // blank line
          `TOTAL_ROWS,${totalRows}`,
          `TOTAL_HIGH_PRIORITY,${totalHighPriority}`,
        ].join("\n");

        return { csvContent, totalRows, totalHighPriority };
      };

      const { csvContent, totalRows, totalHighPriority } = generateCSV(complaints);

      // Verify structure and correctness
      const lines = csvContent.split("\n");
      expect(lines[0]).toBe("ID,Title,Category,Priority,Status,CreatedBy");
      expect(totalRows).toBe(3);
      expect(totalHighPriority).toBe(2);
      expect(lines[lines.length - 2]).toBe("TOTAL_ROWS,3");
      expect(lines[lines.length - 1]).toBe("TOTAL_HIGH_PRIORITY,2");
    });

    it("should generate a valid Excel spreadsheet layout structure", async () => {
      // Seed data
      await createTestComplaint({ title: "Pothole B", category: "Road", priority: "Medium", status: "Pending", createdBy: citizenUser._id });

      const complaints = await Complaint.find({}).lean();

      // Excel layout simulation (JSON sheets)
      const generateExcelLayout = (data) => {
        const sheet = {
          name: "Complaints Report",
          headers: ["Complaint ID", "Title", "Category", "Priority", "Status"],
          rows: data.map((item) => ({
            id: item._id.toString(),
            title: item.title,
            category: item.category,
            priority: item.priority,
            status: item.status,
          })),
          summary: {
            totalCount: data.length,
            statusSummary: {
              Pending: data.filter((i) => i.status === "Pending").length,
              Resolved: data.filter((i) => i.status === "Resolved").length,
            },
          },
        };
        return sheet;
      };

      const excelData = generateExcelLayout(complaints);

      expect(excelData.name).toBe("Complaints Report");
      expect(excelData.headers).toHaveLength(5);
      expect(excelData.rows).toHaveLength(1);
      expect(excelData.rows[0].title).toBe("Pothole B");
      expect(excelData.summary.totalCount).toBe(1);
      expect(excelData.summary.statusSummary.Pending).toBe(1);
      expect(excelData.summary.statusSummary.Resolved).toBe(0);
    });
  });
});
