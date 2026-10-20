import mongoose from "mongoose";
import dns from "dns";
import logger from "../utils/logger.js";

// Fix for Windows / ISP DNS SRV lookup issues (querySrv ECONNREFUSED)
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // Ignore error if custom DNS cannot be set
}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || !mongoUri.trim()) {
    const errorMsg = "❌ Fatal Error: MONGO_URI environment variable is required but missing or empty.";
    if (logger?.error) {
      logger.error({ message: errorMsg });
    } else {
      console.error(errorMsg);
    }
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 25,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    });
    const successMsg = `✅ MongoDB Connected: ${conn.connection.host}`;
    if (logger?.info) {
      logger.info({ message: successMsg, host: conn.connection.host });
    } else {
      console.log(successMsg);
    }
    return conn;
  } catch (error) {
    const failureMsg = `❌ Primary MongoDB Connection Error: ${error.message}`;
    if (logger?.error) {
      logger.error({ message: failureMsg, error: error.message });
    } else {
      console.error(failureMsg);
    }
    process.exit(1);
  }
};

export default connectDB;