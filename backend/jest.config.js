export default {
  testEnvironment: "node",

  // Look for tests inside the tests folder
  roots: ["<rootDir>/tests"],

  // Test file naming convention
  testMatch: ["**/*.test.js"],

  // Enable verbose output
  verbose: true,

  // Collect coverage
  collectCoverage: true,

  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/config/**",
    "!src/seeders/**",
    "!src/scripts/**",
  ],

  coverageDirectory: "coverage",

  coverageReporters: ["text", "lcov", "html"],

  // Setup files to run after env is set up
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocked functions
  restoreMocks: true,

  // Detect open handles (helps find hanging DB connections)
  detectOpenHandles: true,

  // Increase timeout for MongoDB Memory Server
  testTimeout: 60000,
};
