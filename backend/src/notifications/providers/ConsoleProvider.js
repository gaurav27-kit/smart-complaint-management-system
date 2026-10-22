import { BaseProvider } from "./BaseProvider.js";
import logger from "../../utils/logger.js";

/**
 * @file ConsoleProvider.js
 * @description Safe fallback email provider that prints emails to stdout / logs.
 * Useful for local dev, demo environments, and cloud hosts where outbound SMTP ports (25/587) are blocked.
 */
export class ConsoleProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = "console";
  }

  async send({ to, subject, html, text }) {
    const messageId = `mock-${Date.now()}`;
    const plainText = text || this._htmlToText(html);
    logger.info({
      message: `📧 [CONSOLE EMAIL] To: ${to} | Subject: ${subject}`,
      recipient: to,
      subject,
      preview: plainText.slice(0, 200),
      messageId,
      provider: this.name,
    });
    return { messageId, provider: this.name };
  }

  async verify() {
    logger.info({
      message: "✅ Console email provider active (emails logged to console/logs)",
    });
    return true;
  }
}
