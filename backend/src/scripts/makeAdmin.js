import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

async function makeAdmin() {
  const email = process.argv[2];
  const password = process.argv[3] || "admin123";

  if (!email) {
    console.log("Usage: node src/scripts/makeAdmin.js <email> [password]");
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/scms";
    await mongoose.connect(mongoUri);

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      user.role = "admin";
      user.emailVerified = true;
      if (process.argv[3]) {
        user.password = await bcrypt.hash(password, 12);
      }
      await user.save();
      console.log(`✅ Success: User "${user.fullName}" (${user.email}) has been upgraded to role: "admin"!`);
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);
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
