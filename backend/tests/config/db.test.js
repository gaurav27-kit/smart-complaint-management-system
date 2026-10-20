/**
 * @file db.test.js
 * @description Unit tests for database connection configuration and fail-fast behavior.
 */

import { jest } from "@jest/globals";
import mongoose from "mongoose";
import connectDB from "../../src/config/db.js";

describe("Database Configuration & Fail-Fast (B-2)", () => {
  const originalEnv = process.env.MONGO_URI;

  afterEach(() => {
    process.env.MONGO_URI = originalEnv;
    jest.restoreAllMocks();
  });

  it("should fail fast and exit with code 1 if MONGO_URI is missing", async () => {
    delete process.env.MONGO_URI;

    const exitSpy = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with ${code}`);
    });

    await expect(connectDB()).rejects.toThrow("process.exit called with 1");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should fail fast and exit with code 1 if MONGO_URI connection fails", async () => {
    process.env.MONGO_URI = "mongodb://invalid-domain-that-does-not-exist:27017/scms_fail";

    const exitSpy = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with ${code}`);
    });

    const connectSpy = jest.spyOn(mongoose, "connect").mockRejectedValue(new Error("Connection failed"));

    await expect(connectDB()).rejects.toThrow("process.exit called with 1");
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(connectSpy).toHaveBeenCalledWith(
      "mongodb://invalid-domain-that-does-not-exist:27017/scms_fail",
      expect.objectContaining({
        maxPoolSize: 25,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 10000,
      })
    );
  });
});
