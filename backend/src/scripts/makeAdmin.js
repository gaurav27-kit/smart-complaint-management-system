import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";

async function makeAdmin() {
  const email = process.argv[2];
  const isProduction = process.env.NODE_ENV === "production";
  const password = process.argv[3] || process.env.INITIAL_ADMIN_PASSWORD;

  if (!email) {
    console.log("Usage: node src/scripts/makeAdmin.js <email> [password]");
    process.exit(1);
  }

  if (!password) {
    if (isProduction) {
      console.error("❌ Error: In production, you must supply a secure password via argument or INITIAL_ADMIN_PASSWORD env var.");
      process.exit(1);
    }
  }

  const effectivePassword = password || "Admin@SecureDev123";

  if (isProduction && (effectivePassword === "admin123" || effectivePassword.length < 8)) {
    console.error("❌ Error: In production, admin password cannot be default or shorter than 8 characters.");
    process.exit(1);
  }

  try {
    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      user.role = "admin";
      user.emailVerified = true;
      if (process.argv[3] || process.env.INITIAL_ADMIN_PASSWORD) {
        user.password = await bcrypt.hash(effectivePassword, 12);
        user.passwordChangedAt = new Date();
      }
      await user.save();
      console.log(`✅ Success: User "${user.fullName}" (${user.email}) has been upgraded to role: "admin"!`);
    } else {
      const hashedPassword = await bcrypt.hash(effectivePassword, 12);
      user = await User.create({
        fullName: "System Admin",
        email: normalizedEmail,
        password: hashedPassword,
        role: "admin",
        emailVerified: true,
      });
      console.log(`✅ Success: Created new Admin account for (${user.email}) with role: "admin"!`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error setting admin role:", error.message);
    process.exit(1);
  }
}

makeAdmin();
