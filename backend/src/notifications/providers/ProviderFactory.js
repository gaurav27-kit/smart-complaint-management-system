/**
 * @file ProviderFactory.js
 * @description Creates and returns the configured email provider singleton.
 *
 * Design decisions:
 * - Factory pattern: changing provider = changing EMAIL_PROVIDER env variable.
 *   Zero code changes required in any service or controller.
 * - Singleton: the provider is instantiated once and reused for all emails.
 * - Auto-aligns EMAIL_FROM_ADDRESS with SMTP_USER for Gmail SMTP if not explicitly set.
 */

import { SmtpProvider } from "./SmtpProvider.js";
import { ResendProvider } from "./ResendProvider.js";
import { SendGridProvider } from "./SendGridProvider.js";
import { SesProvider } from "./SesProvider.js";
import logger from "../../utils/logger.js";

// Singleton instance — shared across all module imports
let _providerInstance = null;

export class ProviderFactory {
  /**
   * Returns the singleton email provider instance.
   * Creates it on first call based on EMAIL_PROVIDER env variable.
   *
   * @returns {BaseProvider}
   */
  static getProvider() {
    if (_providerInstance) return _providerInstance;

    const providerName = (process.env.EMAIL_PROVIDER || "smtp").toLowerCase();
    const fromName = process.env.EMAIL_FROM_NAME || "SCMS Support";

    // Auto-fallback fromEmail to SMTP_USER if EMAIL_FROM_ADDRESS is missing
    const fromEmail =
      process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER;

    logger.info({ message: `Initializing email provider: ${providerName}` });

    switch (providerName) {
      case "smtp": {
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpUser || !smtpPass) {
          throw new Error(
            "ProviderFactory: `SMTP_USER` and `SMTP_PASS` environment variables are required for SMTP provider.",
          );
        }

        _providerInstance = new SmtpProvider({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT, 10) || 587,
          secure: process.env.SMTP_SECURE === "true",
          user: smtpUser,
          pass: smtpPass,
          fromName,
          fromEmail: fromEmail || smtpUser,
        });
        break;
      }

      case "resend": {
        if (!fromEmail) {
          throw new Error(
            "ProviderFactory: `EMAIL_FROM_ADDRESS` environment variable is required for Resend provider.",
          );
        }
        _providerInstance = new ResendProvider({
          apiKey: process.env.RESEND_API_KEY,
          fromName,
          fromEmail,
        });
        break;
      }

      case "sendgrid": {
        if (!fromEmail) {
          throw new Error(
            "ProviderFactory: `EMAIL_FROM_ADDRESS` environment variable is required for SendGrid provider.",
          );
        }
        _providerInstance = new SendGridProvider({
          apiKey: process.env.SENDGRID_API_KEY,
          fromName,
          fromEmail,
        });
        break;
      }

      case "ses": {
        if (!fromEmail) {
          throw new Error(
            "ProviderFactory: `EMAIL_FROM_ADDRESS` environment variable is required for SES provider.",
          );
        }
        _providerInstance = new SesProvider({
          region: process.env.AWS_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          fromName,
          fromEmail,
        });
        break;
      }

      default:
        throw new Error(
          `ProviderFactory: Unknown email provider '${providerName}'. ` +
            "Valid values: smtp, resend, sendgrid, ses",
        );
    }

    return _providerInstance;
  }

  /**
   * Reset the singleton — useful for testing or hot-swapping providers.
   */
  static reset() {
    _providerInstance = null;
  }
}
