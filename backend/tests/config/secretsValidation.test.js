/**
 * @file secretsValidation.test.js
 * @description Unit tests for production secrets validation and fail-fast startup behavior.
 */

import { jest } from "@jest/globals";
import { validateEnvironment } from "../../src/server.js";

describe("Production Secrets Fail-Fast Validation (Task 4)", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("should fail fast and exit with code 1 in production when JWT_SECRET is missing", () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;
    process.env.MONGO_URI = "mongodb://127.0.0.1:27017/scms";

    const exitSpy = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with ${code}`);
    });

    expect(() => validateEnvironment()).toThrow("process.exit called with 1");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should fail fast and exit with code 1 in production when MONGO_URI is missing", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "super-secret-jwt-key";
    delete process.env.MONGO_URI;

    const exitSpy = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with ${code}`);
    });

    expect(() => validateEnvironment()).toThrow("process.exit called with 1");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should pass without error in production when all required secrets are set", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "super-secret-jwt-key";
    process.env.MONGO_URI = "mongodb://127.0.0.1:27017/scms";

    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});

    expect(() => validateEnvironment()).not.toThrow();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("should pass without error in development even if secrets are unset", () => {
    process.env.NODE_ENV = "development";
    delete process.env.JWT_SECRET;

    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});

    expect(() => validateEnvironment()).not.toThrow();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
