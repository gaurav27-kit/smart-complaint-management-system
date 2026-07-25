/**
 * @file ResendProvider.js
 * @description Resend.com email provider.
 *
 * Resend is a modern transactional email API popular with startups.
 * Uses fetch (built-in in Node 18+) instead of an SDK to keep dependencies lean.
 *
 * Environment variables required:
 *   RESEND_API_KEY       — from https://resend.com/api-keys
 *   EMAIL_FROM_NAME      — "SCMS Support"
 *   EMAIL_FROM_ADDRESS   — must be from a verified domain in Resend dashboard
 */

import { BaseProvider } from "./BaseProvider.js";
import logger from "../../utils/logger.js";

const RESEND_API_BASE = "https://api.resend.com";

export class ResendProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = "resend";

    if (!config.apiKey) {
      throw new Error("ResendProvider: RESEND_API_KEY is required");
    }
  }

  /**
   * Send an email via Resend API.
   * @param {{ to, subject, html, text }} options
   */
  async send({ to, subject, html, text }) {
    const response = await fetch(`${RESEND_API_BASE}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || this._htmlToText(html),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        `Resend API error ${response.status}: ${errorBody.message || "Unknown error"}`,
      );
    }

    const data = await response.json();

    logger.info({
      message: "Email sent via Resend",
      messageId: data.id,
      to,
      subject,
    });

    return { messageId: data.id, provider: this.name };
  }

  /**
   * Verify API key by fetching account info.
   */
  async verify() {
    try {
      const response = await fetch(`${RESEND_API_BASE}/emails`, {
        method: "GET",
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      // 200 or 405 (method not allowed) both indicate valid auth
      const isValid = response.status !== 401 && response.status !== 403;
      if (isValid) {
        logger.info({ message: "Resend API key verified successfully" });
      }
      return isValid;
    } catch (error) {
      logger.error({ message: "Resend API verification failed", error: error.message });
      return false;
    }
  }
}
