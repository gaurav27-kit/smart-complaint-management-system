import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log("Usage: node src/scripts/resetPassword.js <email> <newPassword>");
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error("❌ Error: Password must be at least 6 characters long.");
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/scms";
    await mongoose.connect(mongoUri);

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.error(`❌ Error: User with email "${email}" not found.`);
      await mongoose.disconnect();
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log(`✅ Success: Password for ${user.fullName} (${user.email}) [Role: ${user.role}] has been updated successfully!`);
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error updating password:", error.message);
    process.exit(1);
  }
}

resetPassword();
