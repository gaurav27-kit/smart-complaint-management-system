/**
 * @file BaseProvider.js
 * @description Abstract base class defining the email provider contract.
 *
 * Design decisions:
 * - Every concrete provider MUST implement `send()` and `verify()`
 * - Instantiating BaseProvider directly throws — enforces the abstract pattern in JS
 * - The interface is intentionally minimal: {to, subject, html, text}
 *   → providers translate this to their specific SDK calls
 * - `name` property on each provider enables logging and metrics tracking
 *   ("email sent via smtp" vs "email sent via resend")
 */

export class BaseProvider {
  /**
   * @param {object} config - Provider-specific configuration
   */
  constructor(config) {
    if (new.target === BaseProvider) {
      throw new TypeError(
        "BaseProvider is abstract and cannot be instantiated directly. " +
          "Use a concrete provider: SmtpProvider, ResendProvider, etc.",
      );
    }
    this.config = config;
    this.name = "base";
  }

  /**
   * Send an email.
   * All concrete providers must implement this method.
   *
   * @param {object} options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject line
   * @param {string} options.html - Rendered HTML body
   * @param {string} [options.text] - Plaintext fallback (auto-generated if not provided)
   * @returns {Promise<{ messageId: string, provider: string }>}
   */
  // eslint-disable-next-line no-unused-vars
  async send(options) {
    throw new Error(
      `${this.constructor.name} must implement the send() method.`,
    );
  }

  /**
   * Verify provider connectivity (e.g., SMTP handshake, API key validation).
   * Called at application startup to catch misconfiguration early.
   *
   * @returns {Promise<boolean>}
   */
  async verify() {
    throw new Error(
      `${this.constructor.name} must implement the verify() method.`,
    );
  }

  /**
   * Strip HTML tags to produce a plaintext email fallback.
   * Used when callers don't provide an explicit `text` parameter.
   *
   * @protected
   * @param {string} html
   * @returns {string}
   */
  _htmlToText(html) {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove style blocks
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove script blocks
      .replace(/<[^>]+>/g, " ") // Strip all tags
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/\s{2,}/g, " ")
      .trim();
  }
}
