/**
 * @file rotateCredentials.js
 * @description Secure credential rotation utility for SCMS.
 *
 * Usage:
 *   node src/scripts/rotateCredentials.js <emails-file-path> [--dry-run | --apply] [--mongo-uri=<uri>]
 *
 * Safety rules:
 * - Passwords are NEVER printed to stdout or logs.
 * - Requires explicit --apply flag to make changes to the database.
 * - In --apply mode, writes credentials ONLY to an external file outside the project directory.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

function maskEmail(email) {
  if (!email || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function maskMongoUri(uri) {
  if (!uri) return "[NOT SET]";
  try {
    const isSrv = uri.startsWith("mongodb+srv://");
    const parsed = new URL(uri.replace("mongodb+srv://", "https://").replace("mongodb://", "http://"));
    const maskedHost = parsed.host.replace(/.*@/, "***@");
    const db = parsed.pathname.replace("/", "") || "default";
    return `${isSrv ? "mongodb+srv" : "mongodb"}://${maskedHost}/${db}`;
  } catch {
    return uri.substring(0, 15) + "...";
  }
}

function generateSecurePassword(length = 24) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*()_+~|}{[]:;?><=";
  const allChars = upper + lower + digits + special;

  // Guarantee at least 2 of each category
  const chars = [
    upper[crypto.randomInt(0, upper.length)],
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    lower[crypto.randomInt(0, lower.length)],
    digits[crypto.randomInt(0, digits.length)],
    digits[crypto.randomInt(0, digits.length)],
    special[crypto.randomInt(0, special.length)],
    special[crypto.randomInt(0, special.length)],
  ];

  while (chars.length < length) {
    chars.push(allChars[crypto.randomInt(0, allChars.length)]);
  }

  // Fisher-Yates shuffle with crypto.randomInt
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

async function rotateCredentials() {
  const args = process.argv.slice(2);
  const emailsFilePath = args.find((a) => !a.startsWith("--"));
  const isApply = args.includes("--apply");
  const isDryRun = args.includes("--dry-run") || !isApply;

  const customUriArg = args.find((a) => a.startsWith("--mongo-uri="));
  const mongoUri = customUriArg ? customUriArg.split("=")[1] : process.env.MONGO_URI;

  if (!emailsFilePath) {
    console.error("Usage: node src/scripts/rotateCredentials.js <emails-file-path> [--dry-run | --apply] [--mongo-uri=<uri>]");
    process.exit(1);
  }

  const resolvedEmailsPath = path.resolve(emailsFilePath);
  if (!fs.existsSync(resolvedEmailsPath)) {
    console.error(`❌ Error: Emails file not found at: ${resolvedEmailsPath}`);
    process.exit(1);
  }

  const rawLines = fs.readFileSync(resolvedEmailsPath, "utf-8");
  const emails = Array.from(
    new Set(
      rawLines
        .split(/\r?\n/)
        .map((line) => line.trim().toLowerCase())
        .filter((line) => line.length > 0 && line.includes("@") && !line.startsWith("#"))
    )
  );

  if (emails.length === 0) {
    console.error("❌ Error: No valid email addresses found in the provided file.");
    process.exit(1);
  }

  console.log("════════════════════════════════════════════════════════════════");
  console.log("           SCMS SECURE CREDENTIAL ROTATION");
  console.log("════════════════════════════════════════════════════════════════");
  console.log(`Execution Mode : ${isApply ? "⚠️ APPLY (Live updates will be written)" : "🔍 DRY RUN (Simulation only, no changes)"}`);
  console.log(`Database Target: ${maskMongoUri(mongoUri)}`);
  console.log(`Accounts Input : ${emails.length} unique emails`);
  console.log("────────────────────────────────────────────────────────────────");

  try {
    await mongoose.connect(mongoUri);

    const foundAccounts = [];
    const missingAccounts = [];
    const credentialsPayload = [];

    for (const email of emails) {
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        missingAccounts.push(email);
        continue;
      }

      const newPassword = generateSecurePassword(24);
      foundAccounts.push({
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        userDoc: user,
        newPassword,
      });
    }

    console.log(`Accounts Found in DB : ${foundAccounts.length}`);
    foundAccounts.forEach((acc) => {
      console.log(`  • [${acc.role.toUpperCase()}] ${acc.fullName} (${maskEmail(acc.email)}) - Active: ${acc.isActive}`);
    });

    if (missingAccounts.length > 0) {
      console.log(`\nAccounts NOT in DB   : ${missingAccounts.length}`);
      missingAccounts.forEach((em) => {
        console.log(`  • ${maskEmail(em)}`);
      });
    }

    if (isDryRun) {
      console.log("\n================ DRY RUN SUMMARY ================");
      console.log(`Target database: ${maskMongoUri(mongoUri)}`);
      console.log(`Ready to rotate ${foundAccounts.length} accounts.`);
      console.log("No changes have been made to the database.");
      console.log("Run with --apply to execute updates and export external credentials file.");
      console.log("=================================================");
      await mongoose.disconnect();
      return;
    }

    // APPLY MODE
    console.log("\nApplying password updates to database...");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const externalOutDir = os.homedir();
    const externalFilePath = path.join(externalOutDir, `scms-rotated-credentials-${timestamp}.txt`);

    let outputContent = `# SCMS Rotated Credentials - ${new Date().toISOString()}\n`;
    outputContent += `# Database: ${maskMongoUri(mongoUri)}\n`;
    outputContent += `# Total Accounts: ${foundAccounts.length}\n`;
    outputContent += `# KEEP THIS FILE SECURE AND DELETE AFTER IMPORTING INTO YOUR PASSWORD MANAGER\n\n`;

    for (const acc of foundAccounts) {
      const hashedPassword = await bcrypt.hash(acc.newPassword, 12);
      acc.userDoc.password = hashedPassword;
      // If user schema supports passwordChangedAt
      if (acc.userDoc.schema.paths.passwordChangedAt) {
        acc.userDoc.passwordChangedAt = new Date();
      }
      await acc.userDoc.save();

      outputContent += `Email: ${acc.email}\n`;
      outputContent += `Name: ${acc.fullName}\n`;
      outputContent += `Role: ${acc.role}\n`;
      outputContent += `New Password: ${acc.newPassword}\n`;
      outputContent += `----------------------------------------\n`;
    }

    // Write file outside repo
    fs.writeFileSync(externalFilePath, outputContent, { mode: 0o600 });

    console.log("\n✅ SUCCESS: Passwords rotated successfully in database.");
    console.log(`Total accounts rotated : ${foundAccounts.length}`);
    console.log(`External secrets file  : ${externalFilePath}`);
    console.log("File permissions set to 0600 (owner read/write only).");
    console.log("⚠️ Passwords were NOT printed to logs. Retrieve them from the file above.");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error during credential rotation:", error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

rotateCredentials();
