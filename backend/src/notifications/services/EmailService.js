/**
 * @file EmailService.js
 * @description Thin wrapper around the active email provider.
 *
 * Responsibilities:
 * - Validates email parameters before sending
 * - Delegates to the provider returned by ProviderFactory
 * - Logs all send attempts with consistent structure
 * - Translates provider errors into meaningful messages
 *
 * This class is intentionally thin — business logic lives in NotificationService.
 * EmailService only knows HOW to send; NotificationService knows WHEN and WHY.
 */

import { ProviderFactory } from "../providers/ProviderFactory.js";
import logger from "../../utils/logger.js";

export class EmailService {
  constructor() {
    // Provider is resolved lazily — no env var required at import time
    this._provider = null;
  }

  /**
   * Get or initialize the provider singleton.
   * @returns {BaseProvider}
   */
  get provider() {
    if (!this._provider) {
      this._provider = ProviderFactory.getProvider();
    }
    return this._provider;
  }

  /**
   * The name of the active provider — stored on Notification records.
   * @returns {string}
   */
  get providerName() {
    return this.provider.name;
  }

  /**
   * Send an email.
   *
   * @param {object} options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Subject line
   * @param {string} options.html - Rendered HTML body
   * @param {string} [options.text] - Plaintext fallback
   * @returns {Promise<{ messageId: string, provider: string }>}
   * @throws {Error} If validation fails or provider send fails
   */
  async send({ to, subject, html, text }) {
    // ─── Input validation ────────────────────────────────────────────────
    if (!to || typeof to !== "string") {
      throw new Error("EmailService: `to` is required and must be a string");
    }
    if (!subject || typeof subject !== "string") {
      throw new Error("EmailService: `subject` is required and must be a string");
    }
    if (!html || typeof html !== "string") {
      throw new Error("EmailService: `html` is required and must be a string");
    }

    const sanitizedTo = to.toLowerCase().trim();

    logger.debug({
      message: "Attempting to send email",
      to: sanitizedTo,
      subject,
      provider: this.providerName,
    });

    try {
      const result = await this.provider.send({
        to: sanitizedTo,
        subject,
        html,
        text,
      });

      logger.info({
        message: "Email delivered successfully",
        to: sanitizedTo,
        subject,
        provider: result.provider,
        messageId: result.messageId,
      });

      return result;
    } catch (error) {
      logger.error({
        message: "Email delivery failed",
        to: sanitizedTo,
        subject,
        provider: this.providerName,
        error: error.message,
      });

      // Re-throw with additional context — caller (NotificationService) handles persistence
      throw new Error(`Email delivery failed via ${this.providerName}: ${error.message}`);
    }
  }

  /**
   * Verify the provider connection.
   * Called at application startup.
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    return this.provider.verify();
  }
}

// Singleton instance — shared across all services
export const emailService = new EmailService();
