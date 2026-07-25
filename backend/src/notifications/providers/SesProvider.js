/**
 * @file SesProvider.js
 * @description Amazon SES email provider using the SES HTTP API v2.
 *
 * Uses the AWS SES API directly without the full AWS SDK to minimize
 * bundle size. For production at scale, the @aws-sdk/client-ses package
 * is recommended (it handles credential rotation, retry, etc.).
 *
 * This implementation uses Nodemailer's SES transport as a middle ground —
 * it handles the AWS Signature v4 signing required by SES.
 *
 * Environment variables required:
 *   AWS_REGION           — e.g., us-east-1
 *   AWS_ACCESS_KEY_ID    — IAM user with ses:SendEmail permission
 *   AWS_SECRET_ACCESS_KEY
 *   EMAIL_FROM_NAME      — "SCMS Support"
 *   EMAIL_FROM_ADDRESS   — must be a verified identity in SES
 *
 * Note: Install @aws-sdk/client-ses separately when activating SES:
 *   npm install @aws-sdk/client-ses
 */

import { BaseProvider } from "./BaseProvider.js";
import logger from "../../utils/logger.js";

export class SesProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = "ses";
    this._transporter = null;
  }

  /**
   * Lazily initialize the transporter to avoid importing AWS SDK unless SES is active.
   * This pattern prevents startup crashes when AWS credentials are not configured.
   */
  async _getTransporter() {
    if (this._transporter) return this._transporter;

    // Dynamic import — only loads AWS SDK when SES provider is actually used
    const [nodemailer, { SESClient, SendRawEmailCommand }] = await Promise.all([
      import("nodemailer"),
      import("@aws-sdk/client-ses"),
    ]);

    const sesClient = new SESClient({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    this._transporter = nodemailer.createTransport({
      SES: { ses: sesClient, aws: { SendRawEmailCommand } },
      sendingRate: 14, // SES default: 14 emails/second
    });

    return this._transporter;
  }

  /**
   * Send an email via Amazon SES.
   * @param {{ to, subject, html, text }} options
   */
  async send({ to, subject, html, text }) {
    const transporter = await this._getTransporter();

    const info = await transporter.sendMail({
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to,
      subject,
      html,
      text: text || this._htmlToText(html),
    });

    logger.info({
      message: "Email sent via Amazon SES",
      messageId: info.messageId,
      to,
      subject,
    });

    return { messageId: info.messageId, provider: this.name };
  }

  /**
   * Verify AWS credentials and SES access.
   * A real implementation would call SES GetAccount or GetSendQuota.
   */
  async verify() {
    try {
      const transporter = await this._getTransporter();
      await transporter.verify();
      logger.info({ message: "Amazon SES connection verified successfully" });
      return true;
    } catch (error) {
      logger.error({ message: "Amazon SES verification failed", error: error.message });
      return false;
    }
  }
}
