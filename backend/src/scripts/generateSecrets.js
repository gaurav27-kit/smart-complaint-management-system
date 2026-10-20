/**
 * @file generateSecrets.js
 * @description Generates high-entropy cryptographic secrets for production deployment.
 *
 * Writes secrets exclusively to an external file outside the project repository.
 * Prints ONLY the file path and variable names (never prints the secret values to console).
 */

import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

function generateHexSecret(bytes = 64) {
  return crypto.randomBytes(bytes).toString("hex");
}

function generateSecrets() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const externalOutDir = os.homedir();
  const externalFilePath = path.join(externalOutDir, `scms-production-secrets-${timestamp}.env`);

  const secrets = {
    JWT_SECRET: generateHexSecret(64),
    REFRESH_TOKEN_SECRET: generateHexSecret(64),
    SESSION_SECRET: generateHexSecret(64),
  };

  let content = `# SCMS Production Secrets Generated on ${new Date().toISOString()}\n`;
  content += `# DO NOT COMMIT THIS FILE OR PASTE ITS CONTENTS INTO PUBLIC CHATS\n`;
  content += `# Permissions: 0600 (Owner Read/Write Only)\n\n`;

  for (const [key, value] of Object.entries(secrets)) {
    content += `${key}=${value}\n`;
  }

  fs.writeFileSync(externalFilePath, content, { mode: 0o600 });

  console.log("════════════════════════════════════════════════════════════════");
  console.log("             SCMS CRYPTOGRAPHIC SECRETS GENERATOR");
  console.log("════════════════════════════════════════════════════════════════");
  console.log(`✅ Fresh 64-byte high-entropy secrets generated.`);
  console.log(`Saved external file : ${externalFilePath}`);
  console.log(`File permissions    : 0600 (User Read/Write Only)`);
  console.log(`Generated variables :`);
  for (const key of Object.keys(secrets)) {
    console.log(`  • ${key}`);
  }
  console.log("────────────────────────────────────────────────────────────────");
  console.log("🔒 Secret values were NOT printed to console or logs.");
  console.log("   Retrieve the values directly from the external file above.");
}

generateSecrets();
