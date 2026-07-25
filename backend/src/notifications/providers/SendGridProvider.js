/**
 * @file SendGridProvider.js
 * @description SendGrid Web API v3 email provider.
 *
 * Uses SendGrid's REST API directly (no @sendgrid/mail SDK)
 * to avoid large SDK dependencies and maintain full control.
 *
 * Environment variables required:
 *   SENDGRID_API_KEY     — from https://app.sendgrid.com/settings/api_keys
 *   EMAIL_FROM_NAME      — "SCMS Support"
 *   EMAIL_FROM_ADDRESS   — must be a verified sender identity in SendGrid
 */

import { BaseProvider } from "./BaseProvider.js";
import logger from "../../utils/logger.js";

const SENDGRID_API_BASE = "https://api.sendgrid.com/v3";

export class SendGridProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = "sendgrid";

    if (!config.apiKey) {
      throw new Error("SendGridProvider: SENDGRID_API_KEY is required");
    }
  }

  /**
   * Send an email via SendGrid Web API v3.
   * @param {{ to, subject, html, text }} options
   */
  async send({ to, subject, html, text }) {
    const payload = {
      personalizations: [
        {
          to: [{ email: to }],
          subject,
        },
      ],
      from: {
        email: this.config.fromEmail,
        name: this.config.fromName,
      },
      content: [
        {
          type: "text/plain",
          value: text || this._htmlToText(html),
        },
        {
          type: "text/html",
          value: html,
        },
      ],
      // Track opens/clicks — disable if privacy-first approach required
      tracking_settings: {
        click_tracking: { enable: false },
        open_tracking: { enable: false },
      },
    };

    const response = await fetch(`${SENDGRID_API_BASE}/mail/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // SendGrid returns 202 Accepted on success (not 200)
    if (response.status !== 202) {
      const errorBody = await response.json().catch(() => ({}));
      const errors = errorBody.errors?.map((e) => e.message).join(", ") || "Unknown error";
      throw new Error(`SendGrid API error ${response.status}: ${errors}`);
    }

    // SendGrid returns messageId in the X-Message-Id header
    const messageId = response.headers.get("X-Message-Id") || "unknown";

    logger.info({
      message: "Email sent via SendGrid",
      messageId,
      to,
      subject,
    });

    return { messageId, provider: this.name };
  }

  /**
   * Verify SendGrid API key by calling the key info endpoint.
   */
  async verify() {
    try {
      const response = await fetch(`${SENDGRID_API_BASE}/user/account`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      const isValid = response.status === 200;
      if (isValid) {
        logger.info({ message: "SendGrid API key verified successfully" });
      }
      return isValid;
    } catch (error) {
      logger.error({ message: "SendGrid API verification failed", error: error.message });
      return false;
    }
  }
}
