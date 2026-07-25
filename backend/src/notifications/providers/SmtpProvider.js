/**
 * @file SmtpProvider.js
 * @description Production-grade Nodemailer SMTP email provider for Gmail & standard SMTP.
 *
 * Configured specifically for Gmail SMTP using Google App Passwords.
 *
 * Environment variables required:
 *   SMTP_HOST        — e.g., smtp.gmail.com (defaults to smtp.gmail.com)
 *   SMTP_PORT        — e.g., 587 (STARTTLS) or 465 (SSL) (defaults to 587)
 *   SMTP_SECURE      — 'true' for port 465, 'false' for 587
 *   SMTP_USER        — your full Gmail address (e.g., user@gmail.com)
 *   SMTP_PASS        — 16-character Google App Password (NOT personal password)
 *   EMAIL_FROM_NAME  — e.g., "SCMS Support"
 *   EMAIL_FROM_ADDRESS — e.g., user@gmail.com (must match or alias authenticated account)
 */

import nodemailer from "nodemailer";
import { BaseProvider } from "./BaseProvider.js";
import logger from "../../utils/logger.js";

export class SmtpProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = "smtp";

    // Validate required credentials
    if (!config.user || !config.pass) {
      throw new Error(
        "SmtpProvider Configuration Error: `SMTP_USER` and `SMTP_PASS` environment variables are required.",
      );
    }

    const host = config.host || "smtp.gmail.com";
    const port = parseInt(config.port, 10) || 587;
    const secure = config.secure !== undefined ? config.secure : port === 465;

    // Create pooled Nodemailer transport
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      // Connection pooling for multi-recipient efficiency
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // Network timeouts to prevent process hangs
      connectionTimeout: 10000, // 10s
      greetingTimeout: 10000,
      socketTimeout: 30000,
    });
  }

  /**
   * Send an email via SMTP.
   *
   * @param {object} options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject line
   * @param {string} options.html - Rendered HTML body
   * @param {string} [options.text] - Plaintext fallback
   * @returns {Promise<{ messageId: string, provider: string }>}
   */
  async send({ to, subject, html, text }) {
    const mailOptions = {
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to,
      subject,
      html,
      text: text || this._htmlToText(html),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      logger.info({
        message: "✅ Email sent successfully via Gmail SMTP",
        recipient: to,
        subject,
        messageId: info.messageId,
        provider: this.name,
      });

      return { messageId: info.messageId, provider: this.name };
    } catch (error) {
      logger.error({
        message: "❌ Gmail SMTP Email delivery failed",
        recipient: to,
        subject,
        error: error.message,
        errorCode: error.code,
        provider: this.name,
      });

      throw new Error(`Gmail SMTP delivery failed to ${to}: ${error.message}`);
    }
  }

  /**
   * Verify SMTP connection health during application startup.
   *
   * @returns {Promise<boolean>}
   */
  async verify() {
    try {
      await this.transporter.verify();
      logger.info({
        message: "✅ Gmail SMTP connection verified and ready to send emails",
        user: this.config.user,
        host: this.config.host || "smtp.gmail.com",
      });
      return true;
    } catch (error) {
      logger.error({
        message: "❌ Gmail SMTP authentication/connection verification failed",
        user: this.config.user,
        host: this.config.host || "smtp.gmail.com",
        error: error.message,
        code: error.code,
        hint: "Ensure 2-Step Verification is enabled on your Google Account and you are using a 16-character App Password.",
      });
      return false;
    }
  }
}
