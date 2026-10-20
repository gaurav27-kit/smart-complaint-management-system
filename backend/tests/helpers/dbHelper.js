/**
 * @file dbHelper.js
 * @description Database testing utility helpers for MongoMemoryServer lifecycle and collection resets.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import connectDB from "../../src/config/db.js";

let mongoServer = globalThis.__MONGO_SERVER__;

/**
 * Initialize MongoMemoryServer and connect using application's native connectDB().
 * Reuses a single shared instance across test files for performance and stability.
 */
export const connectTestDB = async () => {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: "scms_test",
        launchTimeout: 60000,
      },
      spawnTimeoutMS: 60000,
    });
    globalThis.__MONGO_SERVER__ = mongoServer;
  }
  const uri = mongoServer.getUri();
  
  // Set MONGO_URI so existing connectDB() uses the in-memory database
  process.env.MONGO_URI = uri;

  if (mongoose.connection.readyState === 0) {
    await connectDB();
  }
};

/**
 * Clear all documents from all collections to guarantee clean state per test.
 */
export const clearTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

/**
 * Reset test database collections cleanly between test suites.
 */
export const closeTestDB = async () => {
  // Allow pending non-blocking async tasks to complete
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};
